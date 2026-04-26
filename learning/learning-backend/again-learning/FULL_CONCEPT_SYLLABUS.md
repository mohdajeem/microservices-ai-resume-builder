# Professional Mastery Syllabus: Microservices AI Resume Builder

Welcome to your personalized mastery curriculum. This syllabus is designed to deconstruct your project into its fundamental and advanced components, ensuring you understand not just **how** it works, but **why** it was built this way and how it scales.

---

## Phase 1: Project Audit

### 1. Implementation Logic (Coding Patterns & Libraries)
- **Node.js (ES Modules):** Utilizing modern `import/export` syntax for a modular backend.
- **Express.js Framework:** Leveraged for building RESTful APIs across all microservices.
- **Asynchronous Programming:** Extensive use of `async/await` for non-blocking I/O operations (API calls, DB queries).
- **Zod Validation:** Schema-based validation for request payloads to ensure data integrity.
- **JWT Authentication:** Stateless user session management using `jsonwebtoken`.
- **Google Gemini AI Integration:** Prompt engineering and structured JSON output handling with `@google/generative-ai`.
- **LaTeX Templating:** Dynamic generation of `.tex` files using custom string escaping and formatting logic.
- **PDF Processing:** Using `pdfjs-dist` to parse PDF files in the `ats-service`.
- **Worker Threads:** Offloading CPU-intensive tasks (PDF parsing) using Node.js `worker_threads` to keep the event loop free.

### 2. Low-Level Design (LLD)
- **Middleware Pattern:** Centralized logic for authentication, rate limiting, logging, and error handling.
- **Proxy Pattern:** Using `http-proxy-middleware` in the Gateway to route traffic while abstracting service locations.
- **Service Layer Pattern:** Separating business logic (AI communication, LaTeX generation) from controllers.
- **Data Schemas (Mongoose):** 
    - **Master vs. Snapshot Strategy:** `MasterProfile` for canonical data and `ResumeVersion` for immutable snapshots.
    - **Upsert Logic:** Using `findOneAndUpdate` with `upsert: true` for efficient profile management.
- **Sanitization Logic:** Recursive cleaning of MongoDB query operators to prevent NoSQL injection.

### 3. High-Level Design (HLD)
- **Microservices Architecture:** 7+ independent services (`auth`, `resume`, `ats`, `compiler`, `gateway`, `payment`, `ai-service`).
- **API Gateway Pattern:** Single entry point for all frontend requests, handling cross-cutting concerns (Auth, Rate Limiting).
- **Stateless Identity Propagation:** Gateway verifies JWT and injects `x-user-id` into headers for downstream services.
- **External API Integration:** Integration with Google Gemini for AI-powered auditing and scoring.
- **Infrastructure as Code (Docker):** Containerization of each service for consistent deployment environments.
- **Redis Integration:** Using Redis for distributed rate limiting across multiple gateway instances.
- **Ephemeral File System Management:** The `latex-compiler` uses temporary directories for secure, isolated compilation.

---

## Phase 2: Learning Modules (Table of Contents)

### Module 1: The Gateway Pattern & Distributed Rate Limiting
*Deep dive into `http-proxy-middleware`, Redis-backed throttling, and request orchestration.*

### Module 2: Stateless Identity Propagation with JWT
*How the gateway secures the entire ecosystem and communicates user context via custom headers.*

### Module 3: Modern Data Modeling (The Master-Snapshot Strategy)
*Understanding why we separate the Master Profile from Resume Versions and how to implement it with Mongoose.*

### Module 4: Engineering AI Workflows (Gemini Integration)
*Prompt engineering, sanitizing AI outputs, and implementing fallback scoring algorithms.*

### Module 5: Dynamic PDF Generation with LaTeX & Tectonic
*The architecture of the `latex-compiler`, string escaping, and managing ephemeral file systems.*

### Module 6: High-Performance PDF Parsing with Worker Threads
*Why and how to use `worker_threads` for CPU-bound tasks in Node.js.*

### Module 7: Defensive Programming & Microservices Security
*NoSQL injection mitigation, Zod validation, and securing internal service-to-service communication.*

---

## Phase 3: The Interrogator’s List (Interview Readiness)

1.  **System Reliability:** "Your API Gateway is a Single Point of Failure (SPOF). How would you architect this to be highly available in a production environment?"
2.  **Statelessness:** "Why do we inject `x-user-id` headers instead of letting each microservice verify the JWT themselves? What are the security trade-offs of this approach?"
3.  **Concurrency:** "How does the `ats-service` handle multiple users uploading large PDFs simultaneously without crashing the event loop?"
4.  **Data Integrity:** "Explain the Master/Snapshot data model. Why not just keep one `Resume` document with an array of versions?"
5.  **Failure Scenarios:** "If the Google Gemini API goes down, what happens to your `ats-service`? Walk me through the fallback mechanism."
6.  **Performance:** "LaTeX compilation is a heavy process. How would you handle a 10x spike in resume generation requests without overloading the `latex-compiler`?"
7.  **Security:** "How do you prevent a malicious user from injecting arbitrary LaTeX commands that could read sensitive files from the server during compilation?"
8.  **Scalability:** "If we need to add a new `job-search-service`, what steps are required at the Gateway level to integrate it?"
9.  **Complexity Analysis:** "What is the time complexity of your fallback scoring algorithm compared to the AI-based scoring?"
10. **State Management:** "Since your services are stateless, how do you handle a long-running process like a 30-second AI audit without the client timing out?"

---

**Next Step:** Please say **"Proceed"** to begin **Module 1: The Gateway Pattern & Distributed Rate Limiting**.
