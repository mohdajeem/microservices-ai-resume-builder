# Backend Architecture — ATS‑Friendly Resume Builder

This document is a deep-dive technical analysis of the backend microservices architecture for the ATS‑Friendly Resume Builder. It documents system architecture, microservice responsibilities, data flow, security, scalability considerations, and recommendations.

**System Architecture Overview**

- Architecture Pattern: An API Gateway (`gateway`, port 8000) acts as a reverse proxy and single entry point. The gateway authenticates requests, enforces rate limits, rewrites paths and forwards traffic to downstream services using `http-proxy-middleware`.
- Microservices and ports:
  - `auth-service` — port 4000 (public auth routes /api/auth)
  - `resume-generator` — port 5000 (/api/resume)
  - `latex-compiler` — port 6000 (/api/compiler)
  - `ats-service` — port 7000 (/api/ats)
- Reverse Proxy: Gateway strips API prefixes (e.g., `^/api/resume` -> ``) and forwards to corresponding service hosts. The gateway also injects identity headers for downstream services and centralizes cross-cutting concerns.

**Microservice Breakdown**

**Gateway**
- Key files: `src/routes/proxyRoutes.js`, `src/middlewares/authMiddleware.js`, `src/middlewares/rateLimiter.js`.
- Responsibilities: centralized auth, rate limiting, path rewrite, header injection, and error handling for downstream outages.
- Important behaviors:
  - JWT verification: `verifyToken` extracts a Bearer token and calls `jwt.verify(token, process.env.JWT_SECRET)`; on success attaches `req.user`.
  - Rate limiting: Redis-backed `express-rate-limit` store to coordinate limits across gateway instances (`authLimiter`, `aiLimiter`, `generalLimiter`).
  - Proxy config: `createProxyMiddleware` with `pathRewrite` to remove `/api/<service>` prefixes, `changeOrigin: true`, `onProxyReq` for header injection (`x-user-id`, `x-user-email`) and `onError` for friendly 502 responses.

**Resume Generator**
- Key files: `src/controllers/resumeController.js`, `src/services/aiService.js`, `src/services/latexService.js`, `src/models/MasterProfile.js`, `src/models/ResumeVersion.js`, `src/middlewares/security.js`, `src/middlewares/validate.js`.
- Responsibility: store canonical user profile, create snapshot resume versions, run AI audits, generate LaTeX for snapshots.
- Data model strategy — Master vs Snapshot:
  - `MasterProfile`: single canonical profile per user (`userId` unique). Stores personalInfo, experience[], projects[], skills, education, certifications, achievements.
  - `ResumeVersion`: snapshot/cloned content from MasterProfile representing a version targeted at a JD or application. Stores `content`, `latexCode` (cached), optional `jobDescription`, and ATS results (`atsScore`, `atsAnalysis`).
  - Benefit: editing and AI-driven transformations operate on snapshots, preserving canonical master record and enabling multiple tailored resumes.
- Controller flows:
  - `createProfile`: reads `x-user-id`, validates and sanitizes input, upserts `MasterProfile` with `findOneAndUpdate(..., upsert:true)`, generates LaTeX via `generateLatexString`, creates `ResumeVersion` containing `latexCode`.
  - `auditResume`: calls `generateComprehensiveAudit(resumeData, jobDescription)` (AI) and returns structured suggestions to the client for review.
  - `updateResumeVersion`: merges updates into `ResumeVersion.content`, regenerates `latexCode`, and saves snapshot.
  - `getResumeLatex`: returns stored `latexCode` for compile/preview.
- AI Service (`aiService.js`): integrates Google Gemini (`@google/generative-ai`), composes strict JSON prompt and sanitizes output (strips fences). Returns structured audit: `missingKeywords`, `summary`, item-level suggestions classified by type (Grammar|Impact|Keyword).
- LaTeX Service (`latexService.js`): reads `templates/template.tex`, escapes LaTeX special characters, and composes sections for projects, experience, skills, education, certifications and achievements. Returns a full LaTeX string.

**ATS Service**
- Key files: `src/ai/geminiClient.js`, `src/scoring/pdfProcessor.js`, `src/scoring/workerClient.js`, `src/scoring/fallback.js`.
- Responsibility: score resumes against a Job Description, accept PDF or raw text, return structured `ats_score` and recommendations.
- Scoring logic:
  - Primary path: use Gemini AI (`analyzeWithGemini`) to produce JSON { ats_score, summary, strengths, improvements }.
  - Fallback: `calculateBasicScore` performs keyword extraction from JD, tokenizes resume text, counts matches and computes score = matched / uniqueJD * 100. Returns a basic analysis structure when AI is unavailable.
- PDF handling: `pdfProcessor.js` uses `pdfjs-dist/legacy` to extract page text from a Buffer; `workerClient.js` spawns `worker_threads` executing `pdf.worker.js` to offload parsing and avoid blocking the main event loop.

**LaTeX Compiler**
- Key file: `src/compileLatex.js`.
- Responsibility: convert LaTeX strings into binary PDF buffers for download/view.
- Implementation details: writes a `.tex` into a uniquely created temp dir (`fs.mkdtempSync`), invokes `tectonic <texPath> --keep-intermediates` via `exec`, reads the generated PDF into a Buffer, removes temp dir, and returns PDF buffer. Errors are caught, temp files removed, and an error is thrown upward.

**Authentication & Security Architecture**

- JWT Flow:
  - `auth-service` creates tokens on login: `jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' })`.
  - Gateway `verifyToken` extracts Bearer token, verifies the JWT, and attaches `req.user` for proxy header injection.

- Header Injection:
  - After verification, the gateway's `onProxyReq` sets `x-user-id` and `x-user-email` from `req.user`. Downstream services rely on these headers as the caller identity to remain stateless.
  - Important: header trust is safe only if services are only reachable from the gateway (private network) or protected by mutual TLS/firewall.

- Defense Mechanisms:
  - Rate limiting: Redis-backed `express-rate-limit` allows coordinated throttling across gateway instances. `aiLimiter` (5/min), `authLimiter` (10/15min), and `generalLimiter` (100/min) are configured.
  - Mongo sanitization: recursive middleware removes keys starting with `$` or containing `.` in `req.body`, `req.query`, `req.params` to mitigate query operator injection.
  - Validation: Zod-based `validate` middleware prevents malformed or overly large payloads (e.g., max array lengths for experience and bullet points).
  - Passwords: `bcrypt` hashing for stored passwords.
  - AI hygiene: AI outputs are sanitized (strip code fences) and parsed carefully to avoid runtime failures.

**API Gateway Logic (Detailed)**

- `http-proxy-middleware` configuration per route:
  - `target`: target origin (service host), `changeOrigin: true` to rewrite Host header.
  - `pathRewrite: { '^/api/resume': '' }` — strips prefix so downstream receives path sans gateway prefix.
  - `onProxyReq`: used to inject `x-user-id` and other headers and log proxy events.
  - `onError`: returns a graceful JSON 502 when a service is down.

**Create Resume — Data Flow Walkthrough**

1. Client POSTs to `POST https://gateway:8000/api/resume/profile` with `Authorization: Bearer <JWT>` and `body: { userData: ... }`.
2. Gateway `verifyToken` verifies JWT; `aiLimiter` enforces rate limit; gateway rewrites path and proxies to `http://localhost:5000/profile`, injecting `x-user-id` and `x-user-email` headers.
3. Resume service reads `x-user-id`, validates payload using Zod (`validate`), sanitizes using `mongoSanitize`, constructs `masterData`, and upserts `MasterProfile`.
4. Controller makes `initialContent` snapshot, calls `generateLatexString({ content: initialContent })` to create `latexCode`.
5. `ResumeVersion` is created with `content` and `latexCode` and saved to MongoDB.
6. For PDF preview, client requests compile (either by sending LaTeX to `/api/compiler` or by GETting the `latexCode` and POSTing it to the compile endpoint). `latex-compiler` writes the `.tex`, runs `tectonic`, returns a PDF Buffer which gateway proxies back to the client.
7. ATS scanning: client or backend sends resume text or PDF to `/api/ats/scan`. ATS extracts text (PDF path uses worker), calls Gemini AI for scoring and falls back to keyword matching if AI fails. Results can be stored back onto `ResumeVersion`.

**Scalability & Security Analysis**

- Strengths:
  - Separation of concerns with a stateless gateway and focused microservices.
  - Stateless JWT authentication and header-based identity propagation enable horizontal scaling.
  - Redis-backed rate limiting and worker threads for CPU-bound PDF extraction.
  - Cached artifacts (`ResumeVersion.latexCode`) to reduce redundant work.

- Gaps & Recommendations (Prioritized):
  - Enforce network-level trust so only the gateway can set `x-user-id` (private network, firewall rules, or mTLS).
  - Require authentication on `/api/compiler` (or gate compilation behind a queue) to prevent DoS via the compiler.
  - Sandbox LaTeX compilation (containerized worker pool with CPU/memory/time limits) to mitigate arbitrary LaTeX risks.
  - Add proxy timeouts and body size limits at the gateway; implement circuit breakers for AI and compiler calls.
  - Add `x-request-id` propagation and structured logging for distributed tracing and debugging.

**Operational Recommendations**

- Short term:
  - Require auth for compiler; set proxy timeout & max body sizes; strip incoming `x-user-id` before injecting trusted header.
  - Add `x-request-id` and log at gateway and services.
- Mid term:
  - Containerize LaTeX compile jobs with resource quotas and a limited worker pool/queue.
  - Implement circuit breakers and retries for AI calls.
- Long term:
  - Add contract tests and CI checks for gateway->service path rewrite and header contracts.
  - Implement OpenTelemetry tracing and central logging/metrics.

**Appendix — Code References (selected)**
- Gateway: `src/routes/proxyRoutes.js`, `src/middlewares/authMiddleware.js`, `src/middlewares/rateLimiter.js`.
- Resume Generator: `src/controllers/resumeController.js`, `src/services/aiService.js`, `src/services/latexService.js`, `src/models/MasterProfile.js`, `src/models/ResumeVersion.js`.
- ATS Service: `src/ai/geminiClient.js`, `src/scoring/pdfProcessor.js`, `src/scoring/workerClient.js`, `src/scoring/fallback.js`.
- LaTeX Compiler: `src/compileLatex.js`.
- Auth Service: `src/controllers/authController.js`, `src/middlewares/security.js`, `src/models/User.js`.

---

Next steps offered:
- create a PR implementing short-term fixes (compiler auth, proxy timeouts, header hardening),
- create an end-to-end compile test via the gateway, or
- add monitoring/tracing scaffolding.

Specify which action you'd like next.
