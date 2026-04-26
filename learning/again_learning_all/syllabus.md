# Project Nexus: Microservices AI Resume Builder - Learning Syllabus

This syllabus is a structured deep-dive into the "Nexus" codebase. It follows a progressive path from high-level architecture down to the specific implementation details of every microservice and frontend component.

---

## 🏗️ Module 1: High-Level Architecture (HLD)
*Understanding the "Big Picture" and how services communicate.*

- **Topic 1: Microservices Ecosystem & Docker Orchestration**
  - Why Microservices? (Scalability, Fault Isolation).
  - Anatomy of `docker-compose.yml`: Networking, Volumes, and Environment Management.
  - The Role of the Shared Network (`nexus-network`).
- **Topic 2: API Gateway Pattern**
  - The Gateway as the Entry Point (`backend/gateway`).
  - Request Routing & Reverse Proxying using `http-proxy-middleware`.
  - Security Layer: Helmet, Compression, and CORS configuration.
- **Topic 3: Cross-Service Communication**
  - RESTful Internal Communication.
  - Secure Service-to-Service Requests: The `NEXUS_INTERNAL_SECRET` mechanism.
  - Request Flow: From Client -> Gateway -> Service -> AI Orchestrator.

---

## 🔐 Module 2: Authentication & Security
*Securing the workspace and user data.*

- **Topic 1: JWT (JSON Web Token) Implementation**
  - Stateless Auth Strategy in `auth-service`.
  - Token Generation, Signing, and Verification.
- **Topic 2: Middleware & Route Protection**
  - Centralized Auth Middleware in the Gateway vs. Local Service protection.
  - Handling CORS and Session Cookies in a Microservices environment.
- **Topic 3: Environment & Secret Management**
  - `.env` strategies across 8+ services.
  - Protecting internal routes from external exposure via `requireInternal` middleware.

---

## 🧠 Module 3: AI Orchestration & Service Logic
*The "Brain" of the project.*

- **Topic 1: AI Provider Abstraction (`ai-service`)**
  - Implementing Google Gemini & Groq LLM integrations.
  - The Provider Pattern: Switching between AI models via environment variables.
- **Topic 2: Prompt Engineering & Data Transformation**
  - Analyzing how the `resume-generator` and `ats-service` structure prompts.
  - Parsing AI responses into structured JSON for the frontend.
- **Topic 3: Optimized Caching with Redis**
  - Why Redis in a Resume Builder?
  - Implementing Rate Limiting and Performance Caching in the Gateway.

---

## 📄 Module 4: Specialized Microservices
*Deep-dives into task-specific services.*

- **Topic 1: LaTeX Compiler Service**
  - Bridging Node.js and TeX: The `latex-compiler` workflow.
  - Asynchronous PDF Rendering and File System Management.
- **Topic 2: ATS (Applicant Tracking System) Service**
  - Scoring Logic: How the AI evaluates resumes against job descriptions.
  - Keyword extraction and feedback loops.
- **Topic 3: Resume Generator & Interview Prep**
  - Dynamic content generation based on user profiles.
  - Generating context-aware interview questions.

---

## ⚛️ Module 5: Frontend Mastery (React + Vite)
*Building the User Interface.*

- **Topic 1: Modern React Architecture**
  - Global State Management with `Context API` (`AuthContext`, `InterviewContext`).
  - Component Design Patterns: Container/Presentational and Custom Hooks.
- **Topic 2: Client-Side API Integration**
  - Centralized API layer in `client/src/lib/api.js`.
  - Handling loading states, error boundaries, and notifications (`ToastContext`).
- **Topic 3: Responsive UI with Tailwind CSS**
  - Configuration of `tailwind.config.js`.
  - Complex Layouts: Form Handlers, Resume Previews, and Interactive Dashboards.

---

## 🛠️ Module 6: Production & Deployment
*Preparing for the real world.*

- **Topic 1: Production Build Pipelines**
  - Comparing `Dockerfile` vs `Dockerfile.prod.example`.
  - Multi-stage builds for optimizing image size.
- **Topic 2: Error Logging & Monitoring**
  - Using `morgan` and custom error handlers.
  - Debugging multi-container logs efficiently.

---

### How to use this syllabus:
To begin your learning journey, reply with:
> **"Teach Module [Number], Topic [Number]"**
*(e.g., "Teach Module 1, Topic 1")*

I will then generate a dedicated deep-dive file for that specific topic.
