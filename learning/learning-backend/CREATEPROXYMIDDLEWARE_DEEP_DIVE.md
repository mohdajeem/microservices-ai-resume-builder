# 🔧 Deep Dive: `createProxyMiddleware` Explained

## Table of Contents
1. [What is `createProxyMiddleware`?](#what-is-createproxymiddleware)
2. [How HTTP Proxy Works](#how-http-proxy-works)
3. [All Parameters Explained](#all-parameters-explained)
4. [Real Examples from Your Code](#real-examples-from-your-code)
5. [Advanced Use Cases](#advanced-use-cases)
6. [Common Pitfalls](#common-pitfalls)

---

## What is `createProxyMiddleware`?

**Source:** `http-proxy-middleware` npm package

**Purpose:** Forward HTTP requests from one server to another server while modifying headers, paths, and handling errors.

**In Plain English:**
Imagine you have a mailroom (Gateway) that receives letters (HTTP requests). Instead of handling all letters at the mailroom, you forward them to different departments (microservices). But you might need to:
- Change the address on the envelope (path rewriting)
- Add a sticky note (inject headers)
- Open the letter and read it (intercept request)
- Handle failed deliveries gracefully (error handling)

That's exactly what `createProxyMiddleware` does!

**Basic Syntax:**
```javascript
import { createProxyMiddleware } from 'http-proxy-middleware';

app.use('/api/auth', createProxyMiddleware({
    // Configuration object
    target: 'http://localhost:4000',
    changeOrigin: true,
    // ... more options
}));
```

---

## How HTTP Proxy Works

### **Without Proxy (Direct Connection)**
```
Client → Service A directly
         (Client knows the address of Service A)
```

### **With Proxy (Your Gateway Pattern)**
```
Client → Gateway → Service A
         (Client only knows Gateway address)
         (Gateway forwards to Service A)
```

**Why Use a Proxy?**
1. ✅ Single entry point (one URL for client)
2. ✅ Centralized authentication (check once at gateway)
3. ✅ Centralized rate limiting (protect all services)
4. ✅ Path rewriting (hide internal structure)
5. ✅ Header injection (add security context)
6. ✅ Load balancing (distribute across instances)
7. ✅ Error handling (graceful fallback when service down)

---

## All Parameters Explained

### **1. `target` (Required)**

**What it does:** Specifies the destination server address

**Type:** `String | Object`

**Usage:**
```javascript
// Simple string format
target: 'http://localhost:4000'

// Object format (for WebSocket support)
target: {
    protocol: 'http:',
    host: 'localhost',
    port: 4000
}
```

**From Your Code:**
```javascript
// Auth Service target
target: 'http://localhost:4000',

// Resume Service target
target: 'http://localhost:5000',
```

**Important:** The `target` is hardcoded per route. In production, you might use:
```javascript
// Get target from environment variable
target: process.env.AUTH_SERVICE_URL || 'http://localhost:4000',

// Or dynamic routing based on path
target: req.path.includes('/resume') ? 'http://localhost:5000' : 'http://localhost:4000'
```

---

### **2. `changeOrigin` (Important)**

**What it does:** Rewrites the `Host` header to match the target server

**Type:** `Boolean`

**Why it matters:**
```javascript
// WITHOUT changeOrigin: true
Client: POST /api/auth
    ↓
Gateway receives: Host: mygateway.com
    ↓
Forwards to Auth Service with: Host: mygateway.com  ❌ WRONG
    ↓
Auth Service sees: This request is from mygateway.com (confusing!)

// WITH changeOrigin: true
Client: POST /api/auth
    ↓
Gateway receives: Host: mygateway.com
    ↓
Forwards to Auth Service with: Host: localhost:4000  ✅ CORRECT
    ↓
Auth Service sees: This request is from localhost:4000 (expected!)
```

**When to Use:**
```javascript
// ALWAYS use changeOrigin: true when proxying to different hosts
changeOrigin: true
```

**From Your Code:**
```javascript
createProxyMiddleware({
    target: 'http://localhost:4000',
    changeOrigin: true,  // Rewrite Host header to localhost:4000
    // ...
})
```

---

### **3. `pathRewrite` (Very Common)**

**What it does:** Transform the request path before sending to target

**Type:** `Object | Function`

**Basic Syntax:**
```javascript
pathRewrite: {
    '^/api/auth': '',           // Remove /api/auth prefix
    '^/api/resume': '',         // Remove /api/resume prefix
    '.*': (path) => path        // Keep original path
}
```

**How it works:**
```javascript
// Client request
POST /api/auth/login
    ↓
// Path matches '^/api/auth'
    ↓
// Rewrite rule: '^/api/auth' → ''
    ↓
// Rewritten path sent to target
POST /login
```

**Visual Example from Your Gateway:**
```javascript
// Request comes in
POST /api/resume/profile

    ↓ Matches this rule:
    ↓ pathRewrite: { '^/api/resume': '' }
    ↓

// Sent to Resume Service as:
POST /profile  (on localhost:5000)
```

**Why Not Just Forward /api/resume/profile?**

Because each service is independently designed:
```javascript
// Auth Service expects:
POST /login      ← NOT POST /api/auth/login
POST /register   ← NOT POST /api/auth/register

// Resume Service expects:
POST /profile    ← NOT POST /api/resume/profile
GET /versions    ← NOT POST /api/resume/versions

// Gateway adds the /api/resume prefix for client clarity,
// then strips it when forwarding to service
```

**Function Format (Advanced):**
```javascript
pathRewrite: function (path, req) {
    // You can add custom logic
    if (path.includes('admin')) {
        // Reject admin paths
        throw new Error('Admin not allowed');
    }
    
    // Multiple rewrites
    if (path.startsWith('/api/auth')) {
        return path.replace(/^\/api\/auth/, '');
    }
    if (path.startsWith('/api/resume')) {
        return path.replace(/^\/api\/resume/, '');
    }
    
    return path;
}
```

**From Your Code (Real Example):**
```javascript
app.use(
    '/api/resume',
    generalLimiter,
    verifyToken,
    createProxyMiddleware({
        target: 'http://localhost:5000',
        changeOrigin: true,
        pathRewrite: { '^/api/resume': '' },  // ← This is critical
        // ...
    })
);

// Flow:
// Client: POST /api/resume/profile
//    ↓
// pathRewrite strips '/api/resume'
//    ↓
// Sent to Resume Service as: POST /profile
```

---

### **4. `onProxyReq` (Critical for Headers)**

**What it does:** Intercept the request BEFORE sending to target; lets you modify headers and body

**Type:** `Function`

**Signature:**
```javascript
onProxyReq: (proxyReq, req, res) => {
    // proxyReq: The request object that will be sent to target
    // req: The original request from client
    // res: The response object (rarely used here)
}
```

**Common Use Cases:**

**A) Inject Identity Headers**
```javascript
onProxyReq: (proxyReq, req, res) => {
    // Attach user identity from JWT verification
    if (req.user) {
        proxyReq.setHeader('x-user-id', req.user.id);
        proxyReq.setHeader('x-user-email', req.user.email);
    }
}
```

**Why this matters:**
```javascript
// Without header injection:
Auth Service receives request
    ↓
Doesn't know who the user is
    ↓
Can't perform user-specific operations (e.g., change password)

// With header injection:
Auth Service receives request with headers:
    - x-user-id: 507f1f77bcf86cd799439011
    - x-user-email: john@example.com
    ↓
Can use these headers to contextualize requests
    ↓
Services are stateless: they get identity from headers, not sessions
```

**B) Add Custom Headers**
```javascript
onProxyReq: (proxyReq, req, res) => {
    // Add correlation ID for tracing
    proxyReq.setHeader('x-request-id', generateUUID());
    
    // Add timestamp
    proxyReq.setHeader('x-timestamp', Date.now());
    
    // Add client IP
    proxyReq.setHeader('x-forwarded-for', req.ip);
}
```

**C) Modify Body (for JSON)**
```javascript
onProxyReq: (proxyReq, req, res) => {
    if (req.body) {
        // Convert body to JSON
        const bodyData = JSON.stringify(req.body);
        
        // Update content-length header
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        
        // Write modified body
        proxyReq.write(bodyData);
    }
}
```

**D) Preserve Headers for File Uploads**
```javascript
// This is IMPORTANT for multipart/form-data (file uploads)
onProxyReq: (proxyReq, req, res) => {
    // Multer sets these, we need to preserve them
    if (req.headers['content-type']) {
        proxyReq.setHeader('Content-Type', req.headers['content-type']);
    }
    if (req.headers['content-length']) {
        proxyReq.setHeader('Content-Length', req.headers['content-length']);
    }
}
```

**From Your Code (Real Examples):**

```javascript
// Example 1: Resume Service - Inject user identity
app.use('/api/resume', verifyToken, createProxyMiddleware({
    target: 'http://localhost:5000',
    changeOrigin: true,
    pathRewrite: { '^/api/resume': '' },
    onProxyReq: (proxyReq, req, res) => {
        console.log(`📄 [Resume] Forwarding to: http://localhost:5000${proxyReq.path}`);
        if (req.user) {
            proxyReq.setHeader('x-user-id', req.user.id);
            proxyReq.setHeader('x-user-email', req.user.email);
            proxyReq.setHeader('x-user-plan', req.user.plan || 'free');
        }
    }
}));

// Example 2: ATS Service - Preserve file upload headers
app.use('/api/ats', verifyToken, createProxyMiddleware({
    target: 'http://localhost:7000',
    changeOrigin: true,
    pathRewrite: { '^/api/ats': '' },
    onProxyReq: (proxyReq, req, res) => {
        // For file uploads, preserve original headers
        if (req.headers['content-type']) {
            proxyReq.setHeader('Content-Type', req.headers['content-type']);
        }
        if (req.headers['content-length']) {
            proxyReq.setHeader('Content-Length', req.headers['content-length']);
        }
    }
}));
```

---

### **5. `onProxyRes` (Intercept Response)**

**What it does:** Modify response AFTER receiving from target, before sending to client

**Type:** `Function`

**Signature:**
```javascript
onProxyRes: (proxyRes, req, res) => {
    // proxyRes: Response from target service
    // req: Original client request
    // res: Response object to send to client
}
```

**Use Cases:**

**A) Add Response Headers**
```javascript
onProxyRes: (proxyRes, req, res) => {
    // Add security headers
    proxyRes.headers['X-Content-Type-Options'] = 'nosniff';
    proxyRes.headers['X-Frame-Options'] = 'DENY';
}
```

**B) Modify Response Body**
```javascript
onProxyRes: (proxyRes, req, res) => {
    // Capture the body (Node.js streams)
    let data = '';
    
    proxyRes.on('data', (chunk) => {
        data += chunk.toString();
    });
    
    proxyRes.on('end', () => {
        // Parse and modify
        const body = JSON.parse(data);
        body.gateway = 'Nexus Gateway';  // Add breadcrumb
        
        // Send modified response
        res.end(JSON.stringify(body));
    });
}
```

**C) Log Response Details**
```javascript
onProxyRes: (proxyRes, req, res) => {
    console.log(`Response Status: ${proxyRes.statusCode}`);
    console.log(`Response Headers:`, proxyRes.headers);
}
```

**Note:** Your code doesn't currently use `onProxyRes`, but you might add it for logging or response transformation.

---

### **6. `onError` (Error Handling)**

**What it does:** Handle when the request to target fails (connection error, timeout, service down)

**Type:** `Function`

**Signature:**
```javascript
onError: (err, req, res) => {
    // err: The error object
    // req: Original client request
    // res: Response to send to client
}
```

**Why it's Critical:**
```javascript
// WITHOUT onError:
Client requests /api/auth
    ↓
Auth Service is down
    ↓
Client gets cryptic error or hangs
    ❌ Bad user experience

// WITH onError:
Client requests /api/auth
    ↓
Auth Service is down
    ↓
onError catches it
    ↓
Returns friendly JSON response
    ✅ Good user experience, debugging info
```

**From Your Code (Real Examples):**

```javascript
onError: (err, req, res) => {
    console.error("❌ Auth Service Error:", err.message);
    res.status(502).json({ error: "Auth Service Down" });
}

onError: (err, req, res) => {
    console.error("❌ Resume Service Error:", err.message);
    res.status(502).json({ error: "Resume Service Down" });
}

onError: (err, req, res) => {
    console.error("❌ ATS Service Error:", err.message);
    res.status(502).json({ error: "ATS Service Down" });
}
```

**Better Error Handling (Advanced):**
```javascript
onError: (err, req, res) => {
    const statusCode = 502;  // Bad Gateway
    
    // Different error messages based on error type
    let message = "Service Unavailable";
    
    if (err.code === 'ECONNREFUSED') {
        message = "Service is not responding";
    } else if (err.code === 'ETIMEDOUT') {
        message = "Service request timed out";
    } else if (err.code === 'ENOTFOUND') {
        message = "Service host not found";
    }
    
    console.error(`❌ Proxy Error: ${message}`, err.message);
    
    res.status(statusCode).json({
        error: message,
        service: req.path,
        timestamp: new Date().toISOString()
    });
}
```

---

### **7. `timeout` (Prevent Hanging)**

**What it does:** How long to wait for target server to respond before giving up

**Type:** `Number` (milliseconds)

**Usage:**
```javascript
timeout: 30000  // Wait 30 seconds, then fail with timeout error
```

**Your code doesn't explicitly set timeout, so it uses default (~120s)**

**Better Practice:**
```javascript
createProxyMiddleware({
    target: 'http://localhost:5000',
    timeout: 30000,  // ← Add this to prevent indefinite waiting
    onError: (err, req, res) => {
        // Will be called if timeout occurs
        res.status(504).json({ error: "Gateway Timeout" });
    }
})
```

---

### **8. `ws` (WebSocket Support)**

**What it does:** Enable WebSocket proxying (not HTTP)

**Type:** `Boolean`

**Usage:**
```javascript
ws: true  // Enable WebSocket support
```

**Your code doesn't use WebSockets, so you don't need this.**

---

### **9. `secure` (HTTPS)**

**What it does:** Validate SSL certificates when proxying to HTTPS target

**Type:** `Boolean`

**Usage:**
```javascript
// In production with HTTPS target
secure: true   // Validate certificate

// In development (self-signed cert)
secure: false  // Ignore certificate validation
```

**Your code proxies to http://localhost (not HTTPS), so not needed.**

---

### **10. `logLevel` (Debugging)**

**What it does:** Control verbosity of proxy logs

**Type:** `String` - Options: `'debug' | 'info' | 'warn' | 'error'`

**Usage:**
```javascript
logLevel: 'debug'  // Very verbose
logLevel: 'info'   // Normal info messages
logLevel: 'warn'   // Only warnings
logLevel: 'error'  // Only errors
```

---

### **11. `preserveHostHdr` (Rarely Used)**

**What it does:** Keep original Host header instead of changing it

**Type:** `Boolean`

**Usually NOT what you want:**
```javascript
preserveHostHdr: false  // ← Default and recommended
// Let the proxy rewrite Host header to match target
```

---

## Real Examples from Your Code

### **Example 1: Public Auth Routes (Login, Register)**

```javascript
app.use(
    '/api/auth',                    // ← What client calls
    generalLimiter,                 // ← Rate limit
    createProxyMiddleware({
        target: 'http://localhost:4000',           // ← Where to send
        changeOrigin: true,                        // ← Rewrite Host
        pathRewrite: { '^/api/auth': '' },        // ← Remove /api/auth prefix
        onProxyReq: (proxyReq, req, res) => {
            console.log(`🔓 [Auth-Public] Forwarding to: http://localhost:4000${proxyReq.path}`);
        },
        onError: (err, req, res) => {
            res.status(502).json({ error: "Auth Service Down" })
        }
    })
);

// Request Flow:
// Client: POST /api/auth/login
//    ↓ Rate limit check
//    ↓ Rewrite path: /api/auth/login → /login
//    ↓ Change Host header
//    ↓ Inject headers (none for public routes)
//    ↓
// Sent to Auth Service: POST http://localhost:4000/login
//    ↓
// Response returned to client
```

---

### **Example 2: Protected Resume Routes (Authenticated)**

```javascript
app.use(
    '/api/resume',
    generalLimiter,
    verifyToken,                    // ← Must be authenticated
    createProxyMiddleware({
        target: 'http://localhost:5000',
        changeOrigin: true,
        pathRewrite: { '^/api/resume': '' },
        onProxyReq: (proxyReq, req, res) => {
            console.log(`📄 [Resume] Forwarding...`);
            if (req.user) {
                // Inject identity after verification
                proxyReq.setHeader('x-user-id', req.user.id);
                proxyReq.setHeader('x-user-email', req.user.email);
                proxyReq.setHeader('x-user-plan', req.user.plan || 'free');
            }
        },
        onError: (err, req, res) => {
            res.status(502).json({ error: "Resume Service Down" })
        }
    })
);

// Request Flow:
// Client: POST /api/resume/profile with Authorization: Bearer <JWT>
//    ↓ Rate limit check
//    ↓ Verify JWT (verifyToken middleware)
//    ↓ If valid, req.user = { id, email, plan }
//    ↓ Rewrite path: /api/resume/profile → /profile
//    ↓ Change Host header
//    ↓ Inject headers: x-user-id, x-user-email, x-user-plan
//    ↓
// Sent to Resume Service: 
// POST http://localhost:5000/profile
// Headers: x-user-id: 507f..., x-user-email: john@..., x-user-plan: pro
//    ↓
// Resume Service reads x-user-id from headers
//    ↓
// Response returned to client
```

---

### **Example 3: File Upload Routes (ATS Service)**

```javascript
app.use(
    '/api/ats',
    aiLimiter,                      // ← Stricter rate limit (5/min)
    verifyToken,
    createProxyMiddleware({
        target: 'http://localhost:7000',
        changeOrigin: true,
        pathRewrite: { '^/api/ats': '' },
        onProxyReq: (proxyReq, req, res) => {
            console.log(`🎯 [ATS] Forwarding...`);
            
            // ← CRITICAL: Preserve headers for multipart uploads
            if (req.headers['content-type']) {
                proxyReq.setHeader('Content-Type', req.headers['content-type']);
            }
            if (req.headers['content-length']) {
                proxyReq.setHeader('Content-Length', req.headers['content-length']);
            }
            
            if (req.user) proxyReq.setHeader('x-user-id', req.user.id);
        },
        onError: (err, req, res) => {
            res.status(502).json({ error: "ATS Service Down" })
        }
    })
);

// Request Flow:
// Client: POST /api/ats/analyze (with multipart file upload)
//    ↓ Rate limit check (strict)
//    ↓ Verify JWT
//    ↓ Rewrite path: /api/ats/analyze → /analyze
//    ↓ ← IMPORTANT: Preserve Content-Type and Content-Length
//    ↓ Inject x-user-id
//    ↓
// Sent to ATS Service:
// POST http://localhost:7000/analyze
// Headers: x-user-id: 507f..., Content-Type: multipart/form-data; boundary=...
//    ↓
// ATS Service uses Multer to receive file
//    ↓
// Response (ATS analysis) returned to client
```

---

## Advanced Use Cases

### **1. Conditional Routing (Route to Different Services Based on Path)**

```javascript
// Route AI endpoints to a separate service
app.use(
    '/api/ai',
    aiLimiter,
    verifyToken,
    createProxyMiddleware({
        target: (req) => {
            // Dynamic target selection
            if (req.path.includes('/advanced')) {
                return 'http://localhost:8001';  // Premium AI service
            }
            return 'http://localhost:5000';      // Standard AI service
        },
        changeOrigin: true,
        pathRewrite: { '^/api/ai': '' }
    })
);
```

---

### **2. Load Balancing (Round-Robin)**

```javascript
let currentService = 0;
const resumeServices = [
    'http://localhost:5000',
    'http://localhost:5001',
    'http://localhost:5002'
];

app.use(
    '/api/resume',
    verifyToken,
    createProxyMiddleware({
        target: (req) => {
            const service = resumeServices[currentService];
            currentService = (currentService + 1) % resumeServices.length;
            return service;
        },
        changeOrigin: true,
        pathRewrite: { '^/api/resume': '' }
    })
);
```

---

### **3. Request Transformation (Audit Logging)**

```javascript
onProxyReq: (proxyReq, req, res) => {
    // Log every request for audit trail
    const timestamp = new Date().toISOString();
    const userId = req.user?.id || 'anonymous';
    const method = req.method;
    const path = req.path;
    
    console.log(`[${timestamp}] ${userId} ${method} ${path}`);
    
    // Also write to database (optional)
    // AuditLog.create({ userId, method, path, timestamp });
    
    // Inject correlation ID for tracing
    const requestId = `${userId}-${Date.now()}`;
    proxyReq.setHeader('x-request-id', requestId);
}
```

---

### **4. Response Caching (Not Built-in)**

```javascript
// Middleware layer above proxy
const responseCache = {};

app.use('/api/resume', (req, res, next) => {
    // Cache GET requests
    if (req.method === 'GET') {
        const cacheKey = `${req.user.id}-${req.path}`;
        if (responseCache[cacheKey]) {
            console.log('Cache hit:', cacheKey);
            return res.json(responseCache[cacheKey]);
        }
    }
    
    // Capture original res.json
    const originalJson = res.json;
    res.json = function(data) {
        if (req.method === 'GET') {
            responseCache[`${req.user.id}-${req.path}`] = data;
        }
        return originalJson.call(this, data);
    };
    
    next();
});
```

---

### **5. Circuit Breaker Pattern (Fail Fast)**

```javascript
let failureCount = 0;
let circuitOpen = false;
const FAILURE_THRESHOLD = 5;
const RESET_TIMEOUT = 60000;  // 1 minute

app.use(
    '/api/resume',
    verifyToken,
    (req, res, next) => {
        if (circuitOpen) {
            return res.status(503).json({ 
                error: "Service temporarily unavailable. Try again later." 
            });
        }
        next();
    },
    createProxyMiddleware({
        target: 'http://localhost:5000',
        changeOrigin: true,
        pathRewrite: { '^/api/resume': '' },
        onError: (err, req, res) => {
            failureCount++;
            
            if (failureCount >= FAILURE_THRESHOLD) {
                circuitOpen = true;
                console.warn('Circuit breaker OPEN');
                
                // Reset after timeout
                setTimeout(() => {
                    circuitOpen = false;
                    failureCount = 0;
                    console.log('Circuit breaker RESET');
                }, RESET_TIMEOUT);
            }
            
            res.status(502).json({ error: "Service unavailable" });
        }
    })
);
```

---

### **6. Compression (Before Sending to Client)**

```javascript
import compression from 'compression';

// Apply compression to all responses
app.use(compression());

app.use(
    '/api/resume',
    verifyToken,
    createProxyMiddleware({
        target: 'http://localhost:5000',
        changeOrigin: true,
        pathRewrite: { '^/api/resume': '' }
        // Response will be compressed automatically
    })
);
```

---

## Common Pitfalls

### **❌ Pitfall 1: Forgetting `changeOrigin: true`**

```javascript
// WRONG:
createProxyMiddleware({
    target: 'http://localhost:5000'
    // changeOrigin not set
})

// Problem:
// Host header still says "mygateway.com"
// Service thinks request came from gateway, not from a client

// CORRECT:
createProxyMiddleware({
    target: 'http://localhost:5000',
    changeOrigin: true  // ← Required
})
```

---

### **❌ Pitfall 2: Incorrect `pathRewrite` Regex**

```javascript
// WRONG:
pathRewrite: {
    '/api/resume': ''  // This doesn't match paths like /api/resume/profile
}

// Problem:
// Only exact /api/resume matches, but /api/resume/profile doesn't match

// CORRECT:
pathRewrite: {
    '^/api/resume': ''  // ← Use ^ to match from start
}

// Now these all match:
// /api/resume → /
// /api/resume/profile → /profile
// /api/resume/versions/123 → /versions/123
```

---

### **❌ Pitfall 3: Missing `onProxyReq` for Headers**

```javascript
// WRONG: Identity injection missing
app.use('/api/resume', verifyToken, createProxyMiddleware({
    target: 'http://localhost:5000',
    // Missing onProxyReq to inject headers
}));

// Problem:
// Service receives request but doesn't know user ID
// Can't perform user-specific operations

// CORRECT:
app.use('/api/resume', verifyToken, createProxyMiddleware({
    target: 'http://localhost:5000',
    onProxyReq: (proxyReq, req) => {
        if (req.user) {
            proxyReq.setHeader('x-user-id', req.user.id);
        }
    }
}));
```

---

### **❌ Pitfall 4: No Error Handling**

```javascript
// WRONG: No onError callback
app.use('/api/resume', verifyToken, createProxyMiddleware({
    target: 'http://localhost:5000'
}));

// Problem:
// If service is down, client hangs or gets cryptic error
// No debugging info in logs

// CORRECT:
app.use('/api/resume', verifyToken, createProxyMiddleware({
    target: 'http://localhost:5000',
    onError: (err, req, res) => {
        console.error('Resume service error:', err.message);
        res.status(502).json({ error: "Resume service unavailable" });
    }
}));
```

---

### **❌ Pitfall 5: File Upload Headers Not Preserved**

```javascript
// WRONG: For multipart uploads
app.use('/api/ats', verifyToken, createProxyMiddleware({
    target: 'http://localhost:7000',
    // Missing content-type and content-length preservation
}));

// Problem:
// Multer on ATS service doesn't receive proper headers
// File upload fails

// CORRECT:
app.use('/api/ats', verifyToken, createProxyMiddleware({
    target: 'http://localhost:7000',
    onProxyReq: (proxyReq, req) => {
        if (req.headers['content-type']) {
            proxyReq.setHeader('Content-Type', req.headers['content-type']);
        }
        if (req.headers['content-length']) {
            proxyReq.setHeader('Content-Length', req.headers['content-length']);
        }
    }
}));
```

---

### **❌ Pitfall 6: Body Modification Not Accounting for Streams**

```javascript
// WRONG: Modifying body without handling streams
onProxyReq: (proxyReq, req) => {
    const newBody = { ...req.body, extra: 'data' };
    proxyReq.write(JSON.stringify(newBody));  // Missing setHeader!
}

// Problem:
// Content-Length header is wrong
// Service receives truncated data

// CORRECT:
onProxyReq: (proxyReq, req) => {
    if (req.body) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
    }
}
```

---

## Summary Table

| Parameter | Required | Purpose | Example |
|-----------|----------|---------|---------|
| `target` | Yes | Destination server | `'http://localhost:5000'` |
| `changeOrigin` | No | Rewrite Host header | `true` |
| `pathRewrite` | No | Transform request path | `{ '^/api/resume': '' }` |
| `onProxyReq` | No | Modify request before sending | Inject headers, modify body |
| `onProxyRes` | No | Modify response after receiving | Add security headers, transform |
| `onError` | No | Handle connection errors | Return friendly error response |
| `timeout` | No | Request timeout in ms | `30000` |
| `ws` | No | Enable WebSocket | `true` |
| `secure` | No | Validate HTTPS certificate | `true` / `false` |
| `logLevel` | No | Logging verbosity | `'debug'` / `'info'` / `'warn'` |

---

## Best Practices for Your Gateway

```javascript
// ✅ GOOD PATTERN for all proxy routes
app.use(
    '/api/servicename',
    rateLimiter,                    // ← Rate limiting
    verifyToken,                    // ← Authentication (if needed)
    createProxyMiddleware({
        target: 'http://localhost:PORT',
        changeOrigin: true,                           // ← Always include
        pathRewrite: { '^/api/servicename': '' },    // ← Always include
        timeout: 30000,                               // ← Prevent hanging
        onProxyReq: (proxyReq, req) => {
            console.log(`✓ [Service] Forwarding to...`);
            
            // ← Inject identity headers
            if (req.user) {
                proxyReq.setHeader('x-user-id', req.user.id);
                proxyReq.setHeader('x-user-email', req.user.email);
            }
            
            // ← Preserve file upload headers if needed
            if (req.headers['content-type']?.includes('multipart')) {
                proxyReq.setHeader('Content-Type', req.headers['content-type']);
            }
        },
        onError: (err, req, res) => {
            console.error('✗ Service Error:', err.message);
            res.status(502).json({ 
                error: "Service temporarily unavailable",
                timestamp: new Date().toISOString()
            });
        }
    })
);
```

---

## Key Takeaways

1. **`createProxyMiddleware` is a middleware** that acts as a reverse proxy
2. **`target` specifies where to forward** the request
3. **`changeOrigin` is almost always needed** to rewrite the Host header
4. **`pathRewrite` transforms paths** between gateway format and service format
5. **`onProxyReq` is where you inject headers** (user identity)
6. **`onError` provides graceful degradation** when services are down
7. **File uploads need header preservation** in `onProxyReq`
8. **Rate limiting should happen BEFORE proxy** middleware
9. **Authentication should happen BEFORE proxy** middleware
10. **Always test the complete flow** from client → gateway → service → back to client

---

This pattern makes your Gateway the single source of truth for:
- ✅ Authentication
- ✅ Authorization  
- ✅ Rate Limiting
- ✅ Request/Response Logging
- ✅ Error Handling
- ✅ Security Headers

Each service stays **stateless and focused** on its core responsibility.
