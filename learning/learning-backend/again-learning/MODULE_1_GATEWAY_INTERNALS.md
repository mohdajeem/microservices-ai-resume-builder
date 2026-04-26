# Module 1: Deep Dive into Reverse Proxies and Distributed State (Redis Internals)

Welcome to Module 1. We are deconstructing the entry point of your architecture: **The Gateway**.

---

## 1. Fundamental Mechanics: What is a Reverse Proxy?

At the **TCP/HTTP layer**, a reverse proxy (like your `gateway` service using `http-proxy-middleware`) acts as an intermediary. 

### The TCP Lifecycle:
1.  **Client Handshake:** The client initiates a 3-way TCP handshake ($SYN \rightarrow SYN-ACK \rightarrow ACK$) with the Gateway.
2.  **Request Parsing:** The Gateway reads the HTTP headers (e.g., `Host`, `Path`).
3.  **Upstream Connection:** The Gateway initiates a *second* TCP connection to the destination service (e.g., `auth-service` at `localhost:4000`).
4.  **Payload Tunneling:** The Gateway "pipes" the request body from the first connection to the second.

### Why use a Proxy?
-   **Abstraction:** The client doesn't know where `auth-service` lives. 
-   **Security:** High-level sanitization and auth occur before hitting core business logic.
-   **SSL Termination:** Encrypted traffic stops at the gateway; internal traffic can be faster (plain HTTP/gRPC).

---

## 2. API & Function Deep-Dive: `http-proxy-middleware`

In [proxyRoutes.js](../../backend/gateway/src/routes/proxyRoutes.js), you use `createProxyMiddleware`. Let's break down the internals:

### Parameters:
-   `changeOrigin: true`: 
    -   **Under the hood:** When `true`, it modifies the `Host` header of the outgoing request to match the `target` URL. 
    -   **Why?** Many backends use the `Host` header for name-based virtual hosting. If you send `localhost:8000` to a service expecting `auth.internal`, it might reject the request.
-   `pathRewrite`: 
    -   RegEx-based transformation. `{'^/api/auth': ''}` means the Gateway receives `/api/auth/login` but the Auth service receives `/login`.
-   `onProxyReq`: 
    -   A life-cycle hook. You use this to inject `x-nexus-secret`. 
    -   **Internals:** This code executes *after* the request is parsed but *before* it is sent to the socket. It modifies the buffer of the outgoing headers.

---

## 3. Tool Internals: Redis & Distributed Rate Limiting

You are using `rate-limit-redis` in [rateLimiter.js](../../backend/gateway/src/middlewares/rateLimiter.js).

### Why Redis is $O(1)$ Fast:
Redis is an **In-Memory Data Store**. Unlike MongoDB which might hit a disk (even with SSDs), Redis serves every operation from RAM.
-   **The Algorithm:** Your `RedisStore` likely uses a **Fixed Window** or **Sliding Window** strategy.
-   **Logic:** For every request, a key (usually `rl:<IP>`) is incremented.
-   **Math:** `INCRBY` and `EXPIRE` in Redis are $O(1)$ operations, meaning the time taken is constant regardless of whether you have 10 or 10,000,000 logged users.

### Why Single-Threaded?
Redis uses an **Event Loop** (I/O Multiplexing via `epoll/kqueue`) similar to Node.js. This removes the overhead of CPU context switching between threads, making it faster for atomic operations.

---

## 4. Edge Case Analysis: "The Breaking Points"

1.  **Zombie Proxy Connections:** If the `auth-service` hangs and doesn't close the connection, the Gateway might keep that socket open. Without a `timeout` configured in `http-proxy-middleware`, the Gateway will eventually run out of file descriptors (EMFILE error) and crash.
2.  **Redis Latency Spike:** If Redis becomes slow (e.g., executing a slow $O(n)$ command like `KEYS *`), every single request to your Gateway will hang because the `rateLimit` middleware is a blocking "gatekeeper."
3.  **Payload Size Mismatch:** If a user uploads a 50MB resume through the Gateway, but the Gateway doesn't have `express.json({ limit: '50mb' })` or the proxy doesn't support streaming large bodies, the connection might be severed mid-transfer.

---

## 5. Hands-on Drill: "The Latency Injector"

Modify your `/api/auth` proxy in [proxyRoutes.js](../../backend/gateway/src/routes/proxyRoutes.js) to log the exact time it takes for the Auth service to respond. 

**Task:** Use the `onProxyRes` hook to calculate the difference between the start of the request and the response.
*Hint:* Set a property on `req` in `onProxyReq` and read it in `onProxyRes`.

---

## 6. The Interrogator’s List (Interview Prep)

1.  Explain the difference between a **Forward Proxy** and a **Reverse Proxy**.
2.  What is the purpose of the `X-Forwarded-For` header in a microservices environment?
3.  Why is Redis better than a local JS `Map()` for rate-limiting in a cluster of 5 Gateways?
4.  What happens to the `changeOrigin` logic if the `target` uses HTTPS but the Gateway uses HTTP?
5.  How would you implement a "Circuit Breaker" on the Gateway if the AI-Service starts returning 500 errors?
6.  Explain the time complexity of a Redis `GET` vs. `ZRANGE`.
7.  What is **Header Injection**, and why do we do it in `onProxyReq`?
8.  How does `helmet()` protect against "MIME Sniffing"?
9.  If the Gateway's `max-age` for CORS is set to 3600, what is happening in the browser's memory?
10. Describe the impact of `compression` middleware on the server's CPU usage for high-traffic binary files.

---

**Next Step:** Once you have completed the drill and reviewed the internals, say **"Proceed"** to move to **Module 2: Authentication & Cryptographic Identity**.
