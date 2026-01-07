# 📚 Nexus Job - Backend Learning Syllabus
## Complete System Design & Implementation Guide

**Last Updated:** December 2025  
**Project Type:** Microservices Architecture with API Gateway  
**Tech Stack:** Node.js, Express, MongoDB, Docker, Stripe, Google Gemini AI

---

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [System Design Patterns](#system-design-patterns)
3. [Microservices Deep Dive](#microservices-deep-dive)
4. [Learning Path](#learning-path)
5. [Component Implementation Guide](#component-implementation-guide)
6. [Design Patterns Used](#design-patterns-used)

---

## Architecture Overview

### High-Level System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT (Frontend)                        │
│                   Port 5173 (Vite/React)                     │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS Requests
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              API GATEWAY (Reverse Proxy)                     │
│                    Port 8000                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ✅ JWT Token Verification                           │   │
│  │ ✅ Rate Limiting (Redis-backed)                     │   │
│  │ ✅ Path Rewriting (/api/resume → /profile)         │   │
│  │ ✅ Header Injection (x-user-id, x-user-email)      │   │
│  │ ✅ Error Handling & Service Health Checks           │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
    │         │              │           │              │
    │         │              │           │              │
    ▼         ▼              ▼           ▼              ▼
┌──────┐ ┌────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐
│Auth  │ │Resume  │ │LaTeX     │ │ATS       │ │Payment  │
│Port  │ │Generator│ │Compiler  │ │Service   │ │Service  │
│4000  │ │Port 5000 │ │Port 6000 │ │Port 7000 │ │Port 9000 │
└──────┘ └────────┘ └──────────┘ └──────────┘ └─────────┘
   │        │          │            │            │
   └────────┴──────────┴────────────┴────────────┘
                      │
                      ▼
            ┌──────────────────────┐
            │     MongoDB          │
            │   (Shared Database)  │
            └──────────────────────┘
```

### Key Architectural Principles

1. **Microservices Pattern**: Each service is independent and handles one business capability
2. **API Gateway Pattern**: Single entry point for all clients; handles cross-cutting concerns
3. **Reverse Proxy**: Gateway rewrites paths and forwards requests to backend services
4. **Stateless Authentication**: JWT tokens + header-based identity propagation
5. **Database per Service Philosophy**: Shared MongoDB but logically separated by collections

---

## System Design Patterns

### 1. **API Gateway Pattern** (Core Pattern)
**Used In:** Gateway Service  
**Problem Solved:** How to route requests to multiple services, handle authentication, rate limiting centrally

**Key Components:**
- Request routing with `http-proxy-middleware`
- JWT verification middleware
- Rate limiting middleware
- Error handling and circuit breaking
- Header injection for downstream services

**Implementation Location:** `backend/gateway/src/routes/proxyRoutes.js`

```javascript
// Core concept: Create proxy for each service
app.use('/api/resume', 
  generalLimiter,              // Rate limit
  verifyToken,                 // Authentication
  createProxyMiddleware({
    target: 'http://localhost:5000',  // Resume service
    pathRewrite: { '^/api/resume': '' }, // Strip prefix
    onProxyReq: (proxyReq, req) => {
      // Inject identity headers
      proxyReq.setHeader('x-user-id', req.user.id);
    }
  })
);
```

---

### 2. **Master-Snapshot Data Model Pattern** (Data Architecture)
**Used In:** Resume Generator Service  
**Problem Solved:** How to maintain a canonical user profile while enabling multiple tailored resumes

**Pattern Structure:**
```
┌─────────────────────────────────┐
│   MasterProfile (Canonical)     │
│  ┌─────────────────────────────┐│
│  │ userId (unique, indexed)    ││
│  │ personalInfo                ││
│  │ experience[]                ││
│  │ projects[]                  ││
│  │ skills {}                   ││
│  │ education[]                 ││
│  │ certifications[]            ││
│  │ achievements[]              ││
│  └─────────────────────────────┘│
└─────────────────────────────────┘
           │ Created When
           ▼
┌─────────────────────────────────────┐
│  ResumeVersion (Snapshot/Clone)    │
│  ┌───────────────────────────────┐ │
│  │ userId                        │ │
│  │ masterProfileId (FK)          │ │
│  │ versionName (e.g., "V1 Tech") │ │
│  │ content (cloned from Master)  │ │
│  │ latexCode (generated)         │ │
│  │ atsScore (optional)           │ │
│  │ atsAnalysis (optional)        │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Benefits:**
- Edit snapshots without affecting canonical profile
- Create multiple tailored resumes for different job applications
- Preserve version history
- Enable A/B testing different content

**Implementation Location:** 
- Model Definition: `backend/resume-generator/src/models/MasterProfile.js`
- Model Definition: `backend/resume-generator/src/models/ResumeVersion.js`
- Controller Logic: `backend/resume-generator/src/controllers/resumeController.js`

---

### 3. **Worker Thread Pattern** (Performance Optimization)
**Used In:** ATS Service (PDF Processing)  
**Problem Solved:** CPU-intensive PDF parsing blocks the main event loop

**Pattern Flow:**
```
┌─────────────────────────────┐
│  Main Thread (Event Loop)   │
│  - Receives HTTP Request    │
│  - Has file buffer (PDF)    │
└─────────────────────────────┘
         │ Offload to
         ▼
┌─────────────────────────────┐
│   Worker Thread             │
│  - Parse PDF (CPU work)     │
│  - Extract text             │
│  - Return result            │
└─────────────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  Main Thread (continues)    │
│  - Send to Gemini AI        │
│  - Return response          │
└─────────────────────────────┘
```

**Implementation Location:** 
- Worker Client: `backend/ats-service/src/scoring/workerClient.js`
- Worker Thread: `backend/ats-service/src/scoring/pdf.worker.js`
- Controller Using It: `backend/ats-service/src/controllers/atsController.js`

---

### 4. **Fallback Pattern** (Resilience)
**Used In:** ATS Service (AI Analysis)  
**Problem Solved:** Handle gracefully when Gemini API fails or is rate-limited

**Pattern Flow:**
```
┌──────────────────────┐
│  Try Gemini AI       │
│  (Advanced Analysis) │
└──────┬───────────────┘
       │
       ├─ Success ──→ Return Rich Analysis
       │
       └─ Failure ──→ Fall back to Keyword Matching
                      (Basic but reliable)
```

**Implementation Location:**
- Fallback Logic: `backend/ats-service/src/scoring/fallback.js`
- Usage: `backend/ats-service/src/controllers/atsController.js`

---

### 5. **Data Normalization Pattern** (Data Handling)
**Used In:** Resume Generator (Profile Creation)  
**Problem Solved:** Frontend may send data in different formats (snake_case, UPPERCASE, nested)

**Pattern:**
```javascript
// Input: Messy data from AI or user
{
  "NAME": "John",
  "EMAIL": "john@example.com",
  "EXPERIENCE": [...],
  "personalInfo": { "phone": "..." }
}

↓ Normalize ↓

// Output: Consistent schema matching MongoDB
{
  "personalInfo": {
    "name": "John",
    "email": "john@example.com",
    "phone": "..."
  },
  "experience": [...]
}
```

**Implementation Location:** `backend/resume-generator/src/controllers/resumeController.js`  
**Helper Function:** `normalizeResumeData()`

---

### 6. **Two-Tier Authentication** (Security)
**Used In:** Gateway + Microservices  
**Pattern:**

```
┌──────────────────────────────────────┐
│  Tier 1: Gateway (Public Interface)  │
│  ┌──────────────────────────────────┐│
│  │ JWT Token Verification           ││
│  │ Extract: id, email, plan         ││
│  │ Attach to req.user               ││
│  └──────────────────────────────────┘│
└──────────────────────────────────────┘
         │ Inject Headers
         ▼
┌──────────────────────────────────────┐
│  Tier 2: Microservices (Private)     │
│  ┌──────────────────────────────────┐│
│  │ Trust Headers (x-user-id, etc)   ││
│  │ If on Private Network, safe      ││
│  │ Use headers to contextualize     ││
│  └──────────────────────────────────┘│
└──────────────────────────────────────┘
```

**Implementation Location:**
- Tier 1: `backend/gateway/src/middlewares/authMiddleware.js`
- Tier 2: Each service reads headers from Gateway

---

### 7. **Rate Limiting Pattern** (Scalability & Protection)
**Used In:** Gateway  
**Problem Solved:** Prevent DoS, protect AI/expensive endpoints

**Three Tiers:**
```
┌─────────────────────────────┐
│  authLimiter                │
│  10 requests / 15 minutes   │  (Auth endpoints)
└─────────────────────────────┘

┌─────────────────────────────┐
│  aiLimiter                  │
│  5 requests / minute        │  (AI intensive: audit, ATS)
└─────────────────────────────┘

┌─────────────────────────────┐
│  generalLimiter             │
│  100 requests / minute      │  (Regular CRUD)
└─────────────────────────────┘
```

**Backend:** Redis (distributed coordination)  
**Implementation Location:** `backend/gateway/src/middlewares/rateLimiter.js`

---

### 8. **Template & Code Generation Pattern** (Content Generation)
**Used In:** Resume Generator (LaTeX Generation)  
**Problem Solved:** Generate consistent, formatted resume PDFs from structured data

**Pattern Flow:**
```
┌──────────────────────┐
│  Resume Data         │
│  (Structured JSON)   │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────────────┐
│  latexService.js             │
│  generateLatexString()        │
│  - Read template.tex          │
│  - Escape LaTeX chars         │
│  - Inject resume sections     │
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────┐
│  LaTeX String        │
│  (Ready for compile) │
└──────────────────────┘
           │
           ▼
┌──────────────────────┐
│  Compiler Service    │
│  - Write to temp dir │
│  - Run tectonic      │
│  - Return PDF buffer │
└──────────────────────┘
```

**Implementation Location:**
- Template: `backend/resume-generator/src/templates/template.tex`
- Service: `backend/resume-generator/src/services/latexService.js`
- Compiler: `backend/latex-compiler/src/compileLatex.js`

---

### 9. **Payment Integration Pattern** (Business Logic)
**Used In:** Payment Service  
**Problem Solved:** Integrate Stripe for subscription management

**Pattern:**
```
1. Frontend Initiates Payment
   POST /api/payment/checkout
   { plan: 'pro' }

2. Payment Service Creates Session
   Returns: stripe.com checkout URL

3. User Completes Payment on Stripe

4. Stripe Calls Webhook
   POST /api/payment/webhook
   (Stripe signature verified)

5. Update User Plan
   subscription.plan = 'pro'
   subscription.status = 'active'

6. Frontend Redirected to Dashboard
```

**Implementation Location:** `backend/payment-service/src/controllers/paymentController.js`

---

### 10. **AI Integration Pattern** (Generative AI)
**Used In:** Resume Generator, ATS Service  
**Problem Solved:** Integrate Google Gemini for intelligent resume analysis

**Pattern:**
```
User Data + Job Description
    │
    ▼
┌─────────────────────────┐
│ Compose Prompt          │
│ - Add system context    │
│ - Include data          │
│ - Specify output format │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ Call Gemini API         │
│ model.generateContent() │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ Sanitize Output         │
│ - Remove markdown       │
│ - Parse JSON            │
│ - Handle errors         │
└──────────┬──────────────┘
           │
           ▼
Structured Analysis Result
```

**Implementation Locations:**
- Resume Audit: `backend/resume-generator/src/services/aiService.js`
- ATS Scoring: `backend/ats-service/src/ai/geminiClient.js`

---

## Microservices Deep Dive

### **Service 1: Gateway (Port 8000)**

#### Responsibility
- **Single entry point** for all client requests
- **Request routing** to correct microservice
- **Authentication** (JWT verification)
- **Rate limiting** to prevent abuse
- **Header injection** for identity propagation
- **Error handling** for downstream failures

#### Key Files
- `backend/gateway/server.js` - Server initialization
- `backend/gateway/src/routes/proxyRoutes.js` - Routing logic
- `backend/gateway/src/middlewares/authMiddleware.js` - JWT verification
- `backend/gateway/src/middlewares/rateLimiter.js` - Rate limiting

#### Flow Example: Create Resume
```
Client → Gateway
  (POST /api/resume/profile with JWT)
    ↓
Gateway verifies JWT, rate limits
    ↓
Gateway rewrites path: /api/resume → /
    ↓
Gateway injects headers: x-user-id, x-user-email
    ↓
Request forwarded to Resume Service (localhost:5000)
    ↓
Response returned to client
```

#### Code Concepts to Master
- `http-proxy-middleware` configuration
- Express middleware pipeline
- JWT token extraction and verification
- Redis-backed rate limiting
- Error handling for service failures

---

### **Service 2: Auth Service (Port 4000)**

#### Responsibility
- User registration with password hashing
- User login with JWT generation
- Password change functionality
- Account deletion
- Get current user profile

#### Data Model: User
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (bcrypt hashed),
  subscription: {
    plan: 'free' | 'pro' | 'ultimate',
    status: 'active' | 'inactive'
  },
  createdAt: Date,
  updatedAt: Date
}
```

#### Key Files
- `backend/auth-service/server.js`
- `backend/auth-service/src/controllers/authController.js`
- `backend/auth-service/src/models/User.js`
- `backend/auth-service/src/routes/authRoutes.js`
- `backend/auth-service/src/middlewares/security.js` - Mongo sanitization

#### Critical Concepts
- **bcryptjs**: Hash passwords with salt rounds
- **JWT**: Create tokens with embedded user info (id, email, plan)
- **MongoDB Sanitization**: Remove $ and . from input to prevent injection
- **Header-based Identity**: Use x-user-id from gateway for auth actions

#### Code Patterns
```javascript
// Password Hashing
const hashedPassword = await bcrypt.hash(password, 10);

// JWT Generation
const token = jwt.sign(
  { id: user._id, email: user.email, plan: user.subscription.plan },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);

// Password Verification
const isMatch = await bcrypt.compare(password, user.password);
```

---

### **Service 3: Resume Generator (Port 5000)**

#### Responsibility
- Store canonical user profile (MasterProfile)
- Create resume snapshots/versions (ResumeVersion)
- Generate AI-powered resume audits
- Create LaTeX code for PDF generation
- Update resume content
- Retrieve resume versions

#### Data Models

**MasterProfile:**
```javascript
{
  userId: String (unique, indexed),
  personalInfo: {
    name, email, phone, linkedin, github, location, portfolio
  },
  experience: [{ role, company, duration, location, points }],
  projects: [{ title, link, tech, date, points }],
  skills: { languages, frameworks, tools, databases, core_concepts, soft_skills },
  education: [{ institute, duration, details }],
  certifications: [String],
  achievements: [String],
  createdAt, updatedAt
}
```

**ResumeVersion:**
```javascript
{
  userId: String,
  masterProfileId: ObjectId (FK to MasterProfile),
  versionName: String (e.g., "Tech Company V1"),
  content: { ...profile content },
  latexCode: String (cached LaTeX),
  jobDescription: String (optional, for context),
  atsScore: Number,
  atsAnalysis: Object,
  createdAt, updatedAt
}
```

#### Key Files
- `backend/resume-generator/server.js`
- `backend/resume-generator/src/controllers/resumeController.js`
- `backend/resume-generator/src/services/aiService.js`
- `backend/resume-generator/src/services/latexService.js`
- `backend/resume-generator/src/models/MasterProfile.js`
- `backend/resume-generator/src/models/ResumeVersion.js`

#### Key Endpoints
```javascript
POST /profile               // Create/update master profile
POST /versions             // Create resume snapshot
GET /versions/:id          // Get specific version
PUT /versions/:id          // Update version content
GET /latex/:versionId      // Get LaTeX code
POST /audit               // Run AI audit on resume
```

#### Critical Concepts

**1. Data Normalization**
```javascript
// Frontend sends messy data → normalizeResumeData() → consistent schema
normalizeResumeData(rawData, userId) {
  return {
    userId,
    personalInfo: { name, email, ... },
    experience: [...],
    // ... etc
  }
}
```

**2. Upsert Pattern** (Create if not exists, else update)
```javascript
const masterProfile = await MasterProfile.findOneAndUpdate(
  { userId }, 
  masterData, 
  { new: true, upsert: true }  // <-- Creates if not found
);
```

**3. LaTeX Generation** (Template-based)
```javascript
// Read template.tex → Escape LaTeX special chars → Inject sections → Full LaTeX
const latexCode = generateLatexString({ content: resumeData });
```

---

### **Service 4: ATS Service (Port 7000)**

#### Responsibility
- Accept resume PDFs or raw text
- Score resume against job description
- Provide strengths and improvement suggestions
- Fallback to keyword matching if AI fails
- Use worker threads for CPU-intensive PDF parsing

#### Key Features
- **PDF Processing**: Parse PDF buffer without blocking main thread
- **AI Analysis**: Gemini API for intelligent scoring
- **Fallback Logic**: Keyword matching when AI unavailable
- **Structured Output**: Consistent JSON response format

#### Data Flow
```
┌──────────────┐
│  Resume PDF  │
│  or Text     │
└──────┬───────┘
       │
       ├─ If PDF: Parse with Worker Thread
       └─ If Text: Use directly
       │
       ▼
┌──────────────────────────┐
│  Resume Text Extracted   │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│  Try Gemini AI Analysis  │
│  (getGeminiScore)        │
└──────┬───────────────────┘
       │
       ├─ Success: Rich analysis with strengths/improvements
       └─ Failure: Fall back to keyword matching
       │
       ▼
┌──────────────────────────┐
│  Return ATS Score        │
│  { ats_score, summary,   │
│    strengths, improvements}
└──────────────────────────┘
```

#### Key Files
- `backend/ats-service/server.js`
- `backend/ats-service/src/controllers/atsController.js`
- `backend/ats-service/src/ai/geminiClient.js`
- `backend/ats-service/src/scoring/pdfProcessor.js`
- `backend/ats-service/src/scoring/workerClient.js`
- `backend/ats-service/src/scoring/fallback.js`

#### Key Endpoints
```javascript
POST /analyze   // Upload PDF + JD, get ATS score
```

#### Critical Concepts

**1. Worker Thread Pattern**
```javascript
// Main thread receives HTTP request
// Offloads CPU work (PDF parsing) to separate thread
const resumeText = await parsePdfInWorker(req.file.buffer);
// Main thread continues with AI analysis while worker parses
```

**2. Gemini AI Integration**
```javascript
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
const result = await model.generateContent(prompt);
// Sanitize output: remove markdown code blocks
```

**3. Fallback Scoring**
```javascript
// Keyword extraction from JD
const jdKeywords = jobDescription.match(/\b[a-zA-Z]{3,}\b/g);

// Count matches in resume
const score = (matchCount / uniqueJD.size) * 100;
```

---

### **Service 5: LaTeX Compiler (Port 6000)**

#### Responsibility
- Convert LaTeX strings to PDF files
- Handle file I/O and temp directories
- Execute tectonic compiler (LaTeX engine)
- Return PDF as binary buffer

#### Implementation Details
```javascript
1. Receive LaTeX string in request body
2. Create temp directory: fs.mkdtempSync('/tmp/latex-')
3. Write .tex file to temp directory
4. Execute: tectonic --keep-intermediates resume.tex
5. Read generated .pdf into Buffer
6. Clean up temp directory
7. Return PDF with Content-Type: application/pdf
```

#### Key Files
- `backend/latex-compiler/server.js`
- `backend/latex-compiler/src/compileLatex.js`
- `backend/latex-compiler/resume.tex` (template)

#### Key Endpoints
```javascript
POST /compile   // Body: { tex, outputName }
                // Returns: PDF binary

GET /health     // Returns: { status: "ok" }
```

#### Critical Concepts

**1. Temp File Handling**
```javascript
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'latex-'));
// ... write and compile
// Always cleanup to prevent disk fill
fs.rmSync(tempDir, { recursive: true, force: true });
```

**2. Child Process Execution**
```javascript
// Execute shell command: tectonic <file> --keep-intermediates
exec(`tectonic ${texPath} --keep-intermediates`, ...);
```

**3. Binary Response**
```javascript
const pdf = await compileLatexToPdf(tex, outputName);
res.setHeader("Content-Type", "application/pdf");
res.send(pdf);  // Send as binary buffer
```

---

### **Service 6: Payment Service (Port 9000)**

#### Responsibility
- Create Stripe checkout sessions for subscriptions
- Handle Stripe webhook events
- Update user subscription plan upon successful payment
- Validate payment requests

#### Integration Points

**With Stripe:**
- Create checkout session (user initiates payment)
- Receive webhook (Stripe confirms payment)
- Verify webhook signature (security)

**With Database:**
- Update user subscription plan
- Store Stripe customer ID

#### Key Files
- `backend/payment-service/server.js`
- `backend/payment-service/src/controllers/paymentController.js`
- `backend/payment-service/src/models/User.js`

#### Key Endpoints
```javascript
POST /checkout      // Frontend calls to create payment session
                    // Returns: { url: "stripe.com/..." }

POST /webhook       // Stripe calls on payment success
                    // (No auth required, signature verified)
```

#### Critical Concepts

**1. Checkout Session Creation**
```javascript
const session = await stripe.checkout.sessions.create({
  payment_method_types: ['card'],
  mode: 'subscription',
  line_items: [{ price: PLANS[plan], quantity: 1 }],
  metadata: { userId, targetPlan: plan },  // Pass context
  success_url: `${FRONTEND_URL}/dashboard?payment=success`,
  cancel_url: `${FRONTEND_URL}/pricing?payment=canceled`
});
```

**2. Webhook Verification**
```javascript
// Verify request signature to ensure it's from Stripe
const event = stripe.webhooks.constructEvent(
  req.body,
  req.headers['stripe-signature'],
  process.env.STRIPE_WEBHOOK_SECRET
);
```

**3. Subscription Update**
```javascript
if (event.type === 'checkout.session.completed') {
  const { userId, targetPlan } = event.data.object.metadata;
  
  await User.findByIdAndUpdate(userId, {
    'subscription.plan': targetPlan,
    'subscription.status': 'active'
  });
}
```

---

## Learning Path

### **Phase 1: Understanding (1-2 weeks)**

#### 1.1 Architecture Deep Dive
- [ ] Read `backend/docs/architecture.md` completely
- [ ] Draw the system diagram on paper
- [ ] Understand each service's responsibility
- [ ] Trace a complete request flow (e.g., user creation → resume creation → ATS scoring)

#### 1.2 Microservices Concepts
- [ ] Study API Gateway pattern (why centralize vs decentralize)
- [ ] Study Master-Snapshot pattern (why not just one resume model)
- [ ] Study Worker Thread pattern (why offload PDF parsing)
- [ ] Study Rate Limiting pattern (why needed)

#### 1.3 Technology Stack
- [ ] Express.js basics (routing, middleware, error handling)
- [ ] MongoDB (schemas, indexing, queries)
- [ ] JWT (token creation, verification)
- [ ] Middleware patterns in Node.js

---

### **Phase 2: Component By Component (4-6 weeks)**

#### Week 1-2: Gateway Service
**Goal:** Build API gateway from scratch

**Topics to Cover:**
1. Express middleware pipeline
2. http-proxy-middleware configuration
3. JWT verification and token extraction
4. Redis-backed rate limiting
5. Path rewriting logic
6. Error handling for service failures
7. Header injection for security

**Exercise:**
- [ ] Create a simple gateway that proxies to one service
- [ ] Add JWT verification middleware
- [ ] Add rate limiting (use in-memory store first, then Redis)
- [ ] Add error handling for service timeouts

**Expected Outcome:** Understanding how to build reverse proxies and central authentication.

---

#### Week 2-3: Auth Service
**Goal:** Understand user authentication and JWT

**Topics to Cover:**
1. User registration flow
2. Password hashing with bcryptjs
3. JWT token creation with claims
4. JWT verification
5. Bcrypt password comparison
6. MongoDB queries (findOne, create, update)
7. Security: Mongo sanitization

**Exercise:**
- [ ] Build user registration endpoint
- [ ] Build login endpoint that returns JWT
- [ ] Implement JWT verification middleware
- [ ] Implement password change logic
- [ ] Add input validation with Zod

**Expected Outcome:** Full understanding of authentication flow and JWT-based identity.

---

#### Week 4: Resume Generator - Data Modeling
**Goal:** Understand master-snapshot pattern and data normalization

**Topics to Cover:**
1. Why separate Master and Version models
2. MongoDB schema design (nested objects, arrays)
3. Unique indexing strategy
4. Data normalization from various input formats
5. Upsert pattern (`findOneAndUpdate` with `upsert: true`)
6. Schema validation

**Exercise:**
- [ ] Create MasterProfile schema and understand all fields
- [ ] Create ResumeVersion schema and understand relationships
- [ ] Write normalization function that handles multiple input formats
- [ ] Write controller to create/update profiles

**Expected Outcome:** Ability to design flexible data models for your use cases.

---

#### Week 5: Resume Generator - LaTeX & AI
**Goal:** Understand content generation and AI integration

**Topics to Cover:**
1. Template-based code generation
2. LaTeX syntax and special character escaping
3. Google Gemini API integration
4. Prompt engineering for AI
5. Output sanitization (removing markdown code blocks)
6. JSON parsing and error handling
7. Fallback patterns for AI failures

**Exercise:**
- [ ] Study the LaTeX template and understand placeholders
- [ ] Build `generateLatexString()` function step by step
- [ ] Integrate Gemini API with proper prompt construction
- [ ] Add output sanitization and error handling
- [ ] Test with various resume data

**Expected Outcome:** Ability to generate content programmatically and integrate with AI APIs.

---

#### Week 6: ATS Service
**Goal:** Understand CPU-bound work offloading and fallback patterns

**Topics to Cover:**
1. PDF parsing (pdfjs-dist)
2. Worker threads for CPU-bound work
3. Thread message passing
4. Keyword extraction and matching
5. Gemini API for analysis
6. Fallback scoring logic
7. Structured error responses

**Exercise:**
- [ ] Understand PDF parsing with pdfjs-dist
- [ ] Build worker thread for PDF processing
- [ ] Build Gemini integration for ATS scoring
- [ ] Implement fallback keyword matching
- [ ] Write controller that orchestrates everything

**Expected Outcome:** Understanding worker threads and how to handle heavy computations in Node.js.

---

#### Week 7: LaTeX Compiler & Payment
**Goal:** Understand file I/O and payment integration

**Topics to Cover:**
1. Temporary file and directory management
2. Child process execution (`exec`)
3. Binary data handling
4. Stripe API integration
5. Webhook verification
6. Metadata passing through payment flow

**Exercise:**
- [ ] Build LaTeX compiler with temp file management
- [ ] Implement Stripe checkout session creation
- [ ] Implement webhook handler with signature verification
- [ ] Write logic to update user subscription

**Expected Outcome:** Understanding file operations and payment system integration.

---

### **Phase 3: Integration & Testing (2 weeks)**

#### Integration Testing
- [ ] Test complete flow: Register → Create Profile → Generate LaTeX → Compile PDF
- [ ] Test ATS scoring with various resume types
- [ ] Test rate limiting behavior
- [ ] Test error handling across services

#### Load Testing
- [ ] Use ab (Apache Bench) or k6 to test gateway load handling
- [ ] Verify rate limiting works under load
- [ ] Monitor MongoDB performance

#### Security Testing
- [ ] Test JWT token expiration
- [ ] Test Mongo injection attempts
- [ ] Test rate limiting bypass attempts
- [ ] Verify header injection security

---

### **Phase 4: Improvements & Optimization (Ongoing)**

#### Short-term (Implement Now)
- [ ] Add authentication to LaTeX compiler endpoint
- [ ] Add request ID propagation for tracing
- [ ] Add timeout configuration to proxy middleware
- [ ] Strip incoming x-user-id before injecting trusted header

#### Mid-term (Plan Next)
- [ ] Add circuit breaker for AI calls
- [ ] Implement request retry logic
- [ ] Add structured logging with Winston
- [ ] Add metrics collection with Prometheus

#### Long-term (Strategic)
- [ ] Containerize with Docker
- [ ] Add OpenTelemetry tracing
- [ ] Implement service health checks
- [ ] Add contract testing between services

---

## Component Implementation Guide

### **Template: Building a New Endpoint**

When you want to add a new feature, follow this template:

```javascript
// 1. DEFINE ROUTE
// routes/exampleRoutes.js
import express from 'express';
import { exampleController } from '../controllers/exampleController.js';

const router = express.Router();

router.post('/example', exampleController);

export default router;

// 2. IMPLEMENT CONTROLLER
// controllers/exampleController.js
import { validate } from '../middlewares/validate.js';
import { mongoSanitize } from '../middlewares/security.js';
import ExampleModel from '../models/Example.js';

export const exampleController = async (req, res) => {
  try {
    // a) Extract user identity from gateway-injected header
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    // b) Validate and sanitize input
    const { data } = req.body;
    // validation logic here
    
    // c) Perform business logic
    const result = await ExampleModel.create({ userId, ...data });

    // d) Return success response
    res.status(201).json({ success: true, data: result });

  } catch (error) {
    console.error("Controller Error:", error);
    res.status(500).json({ error: error.message });
  }
};

// 3. DEFINE SCHEMA
// models/Example.js
import mongoose from 'mongoose';

const ExampleSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  data: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Example', ExampleSchema);

// 4. ADD GATEWAY PROXY
// gateway/src/routes/proxyRoutes.js
app.use(
  '/api/example',
  generalLimiter,
  verifyToken,
  createProxyMiddleware({
    target: 'http://localhost:5000',
    changeOrigin: true,
    pathRewrite: { '^/api/example': '' },
    onProxyReq: (proxyReq, req) => {
      if (req.user) proxyReq.setHeader('x-user-id', req.user.id);
    }
  })
);

// 5. MOUNT IN SERVER
// server.js
import exampleRoutes from './src/routes/exampleRoutes.js';
app.use('/', exampleRoutes);
```

---

## Design Patterns Used

### Summary Table

| Pattern | Used In | Problem | Solution |
|---------|---------|---------|----------|
| **API Gateway** | Gateway | Route multiple services, centralize auth | Reverse proxy with JWT verification |
| **Master-Snapshot** | Resume Generator | Multiple tailored resumes | Separate master profile from versions |
| **Worker Thread** | ATS Service | Block event loop on PDF parsing | CPU-intensive work in separate thread |
| **Fallback** | ATS Service | AI unavailable | Keyword matching as backup |
| **Data Normalization** | Resume Generator | Inconsistent input formats | Map any format to standard schema |
| **Two-Tier Auth** | Gateway + Services | Identity propagation | JWT + header-based trust |
| **Rate Limiting** | Gateway | Prevent abuse/DoS | Redis-backed tier-based limits |
| **Template Generation** | Resume Generator | Consistent formatted content | Template + injection of data |
| **Payment Integration** | Payment Service | Process subscriptions | Stripe checkout + webhooks |
| **AI Integration** | Resume/ATS | Intelligent analysis | Gemini API + prompt engineering |
| **Circuit Breaker** | (Recommended) | Handle service failures | Fail fast, return degraded response |
| **Caching** | (Opportunity) | Reduce redundant work | Cache LaTeX code in ResumeVersion |

---

## Quick Reference: Key Concepts

### **Microservices Communication**
- Services never call each other directly
- All communication through Gateway
- Gateway uses `http-proxy-middleware` for forwarding
- Each service is independently deployable

### **Data Isolation**
- No shared database connections between services
- Each service is stateless (can scale horizontally)
- Identity passed through headers (x-user-id)
- Timestamp fields for auditing (createdAt, updatedAt)

### **Error Handling**
- Try-catch blocks in controllers
- Meaningful error messages in responses
- Fallback mechanisms for external APIs (Gemini, Stripe)
- Logging at critical points

### **Security**
- JWT tokens with expiration (7 days)
- Bcrypt password hashing with salt (rounds=10)
- Mongo sanitization (remove $ and .)
- Rate limiting on expensive endpoints
- Header injection only through gateway

### **Performance**
- Worker threads for CPU-bound operations
- Cached LaTeX code in ResumeVersion
- Indexed fields in MongoDB (userId)
- Connection pooling through Mongoose

---

## Recommended Learning Resources

1. **Express.js Documentation** - Understanding middleware
2. **MongoDB Official Docs** - Schema design and queries
3. **JWT.io** - Understanding JWT tokens
4. **http-proxy-middleware** - Gateway patterns
5. **Google Generative AI** - Gemini API integration
6. **Stripe Documentation** - Payment processing
7. **Node.js Worker Threads** - CPU-bound work
8. **System Design Primer** - Microservices patterns

---

## Next Steps

1. **Read Phase 1** - Understanding architecture (1-2 weeks)
2. **Pick One Service** - Start with Gateway or Auth Service (1 week)
3. **Implement from Scratch** - Don't copy-paste, write each line understanding it
4. **Test Thoroughly** - Unit tests for controllers, integration tests for flows
5. **Document Your Code** - Write comments explaining why, not what
6. **Add Improvements** - Implement short-term recommendations
7. **Move to Next Service** - Repeat process

---

## Key Questions to Ask Yourself

As you learn each component, ask:
1. **Why does this service exist?** (What problem does it solve?)
2. **What data does it own?** (MongoDB collections)
3. **Who calls it?** (Gateway only, in this architecture)
4. **What does it return?** (Success and error responses)
5. **How does it scale?** (Stateless, can run multiple instances)
6. **What are the security concerns?** (Identity, rate limits, input validation)
7. **What are failure points?** (External APIs, database, file I/O)
8. **How would I test it?** (Unit, integration, load tests)

---

**Created:** December 2025  
**For:** Nexus Job Backend Learning  
**Status:** Ready for learning journey
