# Nexus Project: Comprehensive Node.js & Express.js Function Reference

This document catalogs every significant Node.js and Express.js function, middleware, and logic pattern used across the Nexus microservices ecosystem.

---

## 🛡️ 1. Security & Infrastructure Middleware
These functions are the backbone of the system's security and data handling.

### `app.use(helmet())`
*   **Parameters**: `void`
*   **Functionality**: Automatically sets HTTP headers to protect against well-known web vulnerabilities. For example, it removes the `X-Powered-By: Express` header to hide the technology stack from attackers.
*   **Use Case**: Used in the entry file (`server.js`) of `gateway`, `auth-service`, and `ai-service`.

### `requireInternal`
*   **Parameters**: `(req, res, next)`
*   **Functionality**: Our custom "VIP Bouncer" middleware. It checks the request headers for `x-nexus-secret`. If it doesn't match the environment variable `NEXUS_INTERNAL_SECRET`, the request is rejected with a `403 Forbidden`.
*   **Use Case**: Found in almost every internal microservice (e.g., `ai-service/src/middleware/requireInternal.js`) to ensure they only talk to the `gateway`.

### `mongoSanitize`
*   **Parameters**: `(req, res, next)`
*   **Functionality**: Prevents NoSQL Injection attacks. It recursively searches through `req.body`, `req.query`, and `req.params` and deletes any keys that start with `$` or contain a `.`.
*   **Use Case**: Critical for services that interact directly with MongoDB like `auth-service`.

---

## 🛰️ 2. API Gateway & Routing Functions
Functions specific to the Gateway, which manages traffic and authentication.

### `createProxyMiddleware` (from `http-proxy-middleware`)
*   **Parameters**: `options` object (including `target`, `changeOrigin`, `pathRewrite`, `onProxyReq`)
*   **Functionality**: Forwards incoming client requests (e.g., to `/api/auth`) to the correct internal service (e.g., `http://auth-service:4000`).
*   **Key Property: `onProxyReq`**: A hook that allows the gateway to "stamp" the request with user info and internal secrets before it leaves.
*   **Use Case**: The core logic of `gateway/src/routes/proxyRoutes.js`.

### `verifyToken`
*   **Parameters**: `(req, res, next)`
*   **Functionality**: Extracts the Bearer token from the `Authorization` header. It uses `jwt.verify(token, process.env.JWT_SECRET)` to validate the user. If valid, it attaches the decoded user object to `req.user`.
*   **Use Case**: Protects any route that requires a logged-in user.

### `createLimiter` (using `express-rate-limit`)
*   **Parameters**: `(windowMs, max, message)`
*   **Functionality**: Creates a rate-limiting rule. For example, `aiLimiter(60000, 10, "Wait 1 min")` allows only 10 requests per minute to AI services. It uses **Redis** behind the scenes to keep track of request counts even if the Gateway restarts.
*   **Use Case**: Prevents API abuse; found in `gateway/src/middlewares/rateLimiter.js`.

---

## 🧠 3. Specialized Service Functions
Core business logic functions found in specific services.

### `compileLatexToPdf` (Node.js + Shell)
*   **Parameters**: `(texString, fileName, userHash)`
*   **Functionality**: High-level Node.js wrapper that triggers a child process to run `pdflatex`. It handles the asynchronous nature of file system operations to ensure the PDF is ready before sending it back.
*   **Use Case**: The heart of the `latex-compiler` service.

### `checkTier`
*   **Parameters**: `(requiredTier)` (e.g., "pro", "ultimate")
*   **Functionality**: A higher-order function (a function that returns a function). It checks the `req.user.plan` (stored in the JWT) to see if the user is allowed to access premium features (like AI resume auditing).
*   **Use Case**: Enforces monetization; found in `gateway/src/middlewares/subscriptionMiddleware.js`.

---

## ⚡ 4. Standard Node.js / Express Built-ins
Functions you see repeated across every microservice.

| Function | Parameters | Purpose |
| :--- | :--- | :--- |
| `dotenv.config()` | `void` | Loads `.env` file variables into `process.env`. |
| `express.json()` | `{limit: "10mb"}` | Parses JSON bodies. The `limit` is increased in the compiler to handle huge resume strings. |
| `app.listen()` | `(PORT, callback)` | Starts the HTTP server on a specific network port. |
| `mongoose.connect()`| `(URI, options)` | Establishes a permanent connection to MongoDB. |
| `cors()` | `{origin, credentials}` | Configures which frontend domains can talk to the backend. |

---

## 🛠️ Summary of Execution Flow
1.  **Request hits Gateway**: `express.json()` parses it -> `helmet()` secures it -> `cors()` validates origin.
2.  **Gateway Routing**: `verifyToken` (if needed) -> `rateLimiter` (Redis check) -> `createProxyMiddleware` (Routing).
3.  **Forwarding**: `onProxyReq` adds `x-nexus-secret` header.
4.  **Service Processing**: Service uses `requireInternal` to check the secret -> Logic runs -> Result sent back.
