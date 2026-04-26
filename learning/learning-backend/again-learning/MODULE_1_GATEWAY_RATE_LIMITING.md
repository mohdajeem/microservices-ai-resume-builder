# Module 1: The Gateway Pattern & Distributed Rate Limiting

## The 'Why'
In a microservices architecture, exposing every single service (Auth, Resume, ATS, Compiler) directly to the internet is a security and maintenance nightmare. We chose the **API Gateway Pattern** for three critical reasons:
1.  **Single Entry Point:** The frontend only needs to know one URL. The Gateway handles the complexity of routing requests to the correct internal service.
2.  **Cross-Cutting Concerns:** Instead of implementing authentication, logging, and rate limiting in **every** service (which leads to code duplication), we centralize them in the Gateway.
3.  **Security (The DMZ):** Only the Gateway is exposed to the public. Internal services can sit in a private network, trusting the Gateway to have already verified the user.

---

## The Documentation

### 1. Reverse Proxying with `http-proxy-middleware`
The Gateway acts as a **Reverse Proxy**. When a request comes in for `/api/resume/audit`, the Gateway:
-   Intercepts the request.
-   **Path Rewriting:** Maps `/api/resume` to the internal path `/` of the Resume Service.
-   **Forwarding:** Sends the request to `http://resume-service:5000`.

### 2. Distributed Rate Limiting (Redis)
Traditional rate limiting stores request counts in memory. If you have 3 Gateway instances, a user could bypass limits by hitting different instances. 
By using **Redis**, we create a **Distributed Rate Limiter**. All Gateway instances check the same Redis store, ensuring that if a user is limited to 10 requests per minute, they can't exceed that across the entire cluster.

---

## The 'How'

### Reference Snippet 1: Reverse Proxy Configuration
In [backend/gateway/src/routes/proxyRoutes.js](backend/gateway/src/routes/proxyRoutes.js), we define how traffic flows.

```javascript
// Path: microservices-ai-resume-builder/backend/gateway/src/routes/proxyRoutes.js

app.use(
    '/api/resume/audit', 
    aiLimiter, // Applied BEFORE proxying
    verifyToken, // Applied BEFORE proxying
    createProxyMiddleware({
        target: process.env.RESUME_GENERATOR_URL || 'http://localhost:5000',
        changeOrigin: true, // Rewrites the 'Host' header to match the target
        pathRewrite: { '^/api/resume': '' }, // Strips /api/resume from the incoming URL
        onProxyReq: (proxyReq, req, res) => {
            // Internal identity propagation (Module 2 preview)
            proxyReq.setHeader('x-nexus-secret', process.env.NEXUS_INTERNAL_SECRET);
            if (req.user) {
                proxyReq.setHeader('x-user-id', req.user.id);
            }
        }
    })
);
```

### Reference Snippet 2: Redis-Backed Limiter
In [backend/gateway/src/middlewares/rateLimiter.js](backend/gateway/src/middlewares/rateLimiter.js), we utilize `ioredis` and `rate-limit-redis`.

```javascript
// Path: microservices-ai-resume-builder/backend/gateway/src/middlewares/rateLimiter.js

const client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

const createLimiter = (windowMs, max, message) => {
  return rateLimit({
    store: new RedisStore({
      sendCommand: (...args) => client.call(...args), // Uses Redis for shared state
    }),
    windowMs, 
    max, 
    // ...
  });
};

export const aiLimiter = createLimiter(60 * 1000, 10, "AI limit reached. Wait 1 min.");
```

---

## Trade-offs

### Pros
-   **Simplified Client:** The frontend doesn't need to manage multiple base URLs or complex auth headers for different services.
-   **Scalability:** We can scale the Gateway independently of the Resume service.
-   **Global Throttling:** Prevent expensive AI API abuse (Gemini) at the entry point.

### Cons & Scale Limits
-   **Single Point of Failure (SPOF):** If the Gateway goes down, the entire application is inaccessible. 
    - *Mitigation:* Use a Load Balancer (like Nginx or AWS ELB) in front of multiple Gateway instances.
-   **Latency Overhead:** Every request adds a few milliseconds of hop time as it passes through the Gateway.
-   **Redis Dependency:** If Redis fails, the rate limiter usually fails "open" (allowing all traffic) or "closed" (blocking all traffic), depending on configuration.

---

**Next Step:** Please say **"Proceed"** to begin **Module 2: Stateless Identity Propagation with JWT**.