# Backend Learning Plan (Nexus Job Stack)

Audience: You know the programming language (JavaScript/TypeScript) but want to learn to build backend services like this repo. This plan maps to the existing architecture: API Gateway + Auth + Resume Generator + ATS + LaTeX Compiler + Payment + Shared concerns.

## 0. Environment & Tooling
- Node.js LTS, npm
- MongoDB, Redis
- Postman/Insomnia for API testing
- VS Code + REST Client / Thunder Client
- Git + branching
- Basic Linux/Windows shell

**Practice:**
- Install Node/Mongo/Redis locally; create `.env` files.
- Run each service individually with `npm start` and hit `/health` or base routes.

## 1. HTTP & Express Fundamentals
- Express app setup, routing, middleware, error handling.
- JSON parsing, CORS, logging (morgan).
- Async/await and error propagation.

**Practice:** Build a tiny Express service with 3 routes (GET list, POST create with validation, DELETE). Add logging and error handler.

## 2. API Gateway & Reverse Proxy
- Reverse proxy pattern, path rewriting, `http-proxy-middleware`.
- Auth at the edge, header injection (`x-user-id`), rate limiting (Redis).
- Shared concerns: timeouts, onError handling, changeOrigin, pathRewrite.

**Practice:**
- Create a minimal gateway that forwards `/api/service1` and `/api/service2` to two mock services; inject a header and log it downstream.
- Add Redis-backed rate limiter (5 req/min) to one route and verify 429.

## 3. Authentication & Authorization
- JWT issuance (`jwt.sign`), verification, token shape `{ id, email }`.
- Auth routes: register/login/change password/delete account.
- Password hashing with bcrypt.
- Propagating identity via headers from the gateway.

**Practice:**
- Implement register/login in an auth service with MongoDB User model.
- Protect a sample route with JWT middleware; reject missing/invalid tokens.
- Add change-password flow verifying old password.

## 4. Data Modeling with Mongoose
- Schemas and indexes (User unique email, MasterProfile, ResumeVersion).
- Master vs Snapshot pattern (canonical vs versioned document).
- Storing computed artifacts (cached `latexCode`, ATS scores) to avoid recompute.

**Practice:**
- Model `MasterProfile` and `ResumeVersion`; write CRUD for versions with `userId` scoping.
- Add timestamps and projection queries for dashboard lists.

## 5. Validation & Sanitization
- Zod validation middleware (shape + limits for arrays, emails, lengths).
- MongoDB operator sanitization (strip keys starting with `$` or containing `.`).

**Practice:**
- Add a Zod schema for a resume payload; enforce max points per section.
- Write a sanitize middleware and prove it drops `$where` keys in tests.

## 6. Resume Generator Service
- Controllers: createProfile, auditResume, updateResumeVersion, getResumeLatex, list/detail, master profile CRUD, delete/wipe.
- Normalization helper to accept both UPPERCASE and camelCase payloads.
- AI audit integration stub (`generateComprehensiveAudit`).
- LaTeX generation: template + escaping special chars.

**Practice:**
- Implement createProfile that upserts master, clones snapshot, generates LaTeX string.
- Implement updateResumeVersion that normalizes content and regenerates LaTeX.
- Add GET latex/:id that returns plain text LaTeX.

## 7. ATS Service
- PDF text extraction: `pdfjs-dist` via worker threads (`worker_threads`).
- AI scoring primary path (Gemini) + fallback keyword matcher.
- Multer memoryStorage for file upload; 5MB limits.

**Practice:**
- Build a POST /analyze that accepts PDF + jd, extracts text, runs fallback keyword score.
- Add a worker-based parser to avoid blocking the event loop.

## 8. LaTeX Compiler Service
- Compile LaTeX -> PDF with `tectonic` in a temp directory.
- Error handling and cleanup of temp files.

**Practice:**
- Build POST /compile that accepts `{ tex, outputName }`, returns PDF buffer.
- Add basic input size guard (max body size) and timeouts.

## 9. Payment Service (pattern reuse)
- Similar CRUD+payments patterns (not detailed here), but treat as another microservice behind gateway.

**Practice:**
- Expose a sample protected route behind gateway.

## 10. Cross-Cutting Concerns
- Rate limiting with Redis (`express-rate-limit` + `rate-limit-redis`).
- Logging and debug hooks (`onProxyReq`, console, consider pino/winston later).
- Error handling conventions (JSON error shapes).
- Security: header stripping, auth on resource-heavy endpoints (compiler), sandboxing for LaTeX.
- Environment configs (`process.env`), service ports, base URLs.

**Practice:**
- Add rate limiter to AI-heavy routes; return 429 JSON.
- Add a global error handler that returns `{ error: message }`.

## 11. Testing & Observability (next step)
- Unit tests for normalization, sanitization, validation.
- Integration tests: create -> audit -> update -> latex -> compile -> ats analyze.
- Add request IDs and structured logs.

**Practice:**
- Write a test that posts resume data, reads LaTeX, sends to compiler, expects PDF content type.

## 12. Deployment & Ops (outline)
- Env separation (.env per service), process managers, containerization.
- Health endpoints, readiness checks.

---

## Interview-Focused Topics & Practice Questions

**Architecture & Patterns**
- Explain the Reverse Proxy pattern and why a gateway is used here.
- How do you propagate user identity from gateway to services? Risks of `x-user-id`? Mitigations?
- Master vs Snapshot data model advantages and trade-offs.
- Why cache `latexCode` in ResumeVersion? When to invalidate?
- How would you add timeouts/circuit breakers to proxy/AI calls?

**Security**
- How is JWT issued and verified? What claims are used?
- MongoDB injection defenses in this codebase.
- Rate limiting strategy and why Redis.
- Risks of leaving `/api/compiler` unauthenticated; how to harden?
- Safe LaTeX compilation strategies (sandboxing, quotas).

**Data & Validation**
- How Zod validation prevents payload abuse; what limits are set?
- Normalization of resume data (uppercase vs camelCase) and why.

**AI/ATS**
- How PDF text extraction works with `pdfjs-dist` and worker threads.
- Fallback scoring algorithm; limitations and possible improvements.
- Handling malformed AI responses (stripping code fences, JSON parse).

**Performance & Scalability**
- Where is the system stateless? What stateful parts exist?
- Redis-backed rate limits in a scaled gateway.
- Worker threads for CPU-bound PDF parsing.

**Ops/Testing**
- How to integration-test the flow: create -> audit -> update -> latex -> compile -> ats.
- What logs/metrics would you add? Request IDs?

**Behavioral/Scenario**
- If ATS AI fails, how does the system degrade? How would you surface this to the user?
- If compiler is slow, how to protect the gateway and users?

---

## Suggested 4-Week Practice Plan

**Week 1: Foundations**
- Express basics, JWT auth, bcrypt, simple Mongo models.
- Build mini auth + one protected route.

**Week 2: Gateway & Services**
- Implement a gateway with pathRewrite and header injection.
- Build a resume-service skeleton: create/list/detail/update using Mongo.
- Add validation + sanitization middleware.

**Week 3: Advanced Features**
- Add LaTeX generation from JSON; expose GET latex/:id.
- Implement compiler service to produce PDFs.
- Add ATS fallback scoring and PDF parsing.

**Week 4: Hardening & Observability**
- Add rate limiting, timeouts, and better error handling.
- Add tests for normalization, validation, and end-to-end compile.
- Add request IDs and structured logging.

Track progress by shipping a thin slice each week (code + test).

---

## Daily Practice Checklist
- Write or refactor one controller.
- Add/adjust one validation rule.
- Run one integration test (or manual Postman flow).
- Read logs for a request end-to-end and note latency/errors.
- Document a risk and a mitigation.

---

## How to Use This Repo to Learn
1) Start services: `start-all.ps1` or VS Code tasks, then hit gateway routes only.
2) Follow the practice items per section; implement missing tests or small features.
3) For each service, open its `server.js` and `src/*` to mirror patterns in your practice projects.
4) Use `docs/API_SPECIFICATION_FOR_FRONTEND.md` to drive end-to-end manual tests.

Happy building!
