# Deep-Dive: Module 1, Topic 1 - Microservices Ecosystem & Docker Orchestration

This document provides a comprehensive breakdown of the architectural foundation of Project Nexus.

---

## 🏗️ 1. Why Microservices?

In Nexus, we use a microservices architecture instead of a monolith. Here's why:

*   **Scalability**: We can scale the `ai-service` (high CPU/RAM) independently of the `auth-service` (low resource usage).
*   **Fault Isolation**: If the `latex-compiler` crashes due to a corrupt `.tex` file, the `auth-service` and `gateway` remain functional.
*   **Tech Stack Flexibility**: While most services use Node.js, the `latex-compiler` relies on system-level TeX Live binaries, isolated in its own container.

---

## 🐳 2. Anatomy of `docker-compose.yml`

The `docker-compose.yml` file is the orchestrator that brings the entire ecosystem to life.

### A. Networking: `nexus-network`
All services are connected via a custom bridge network called `nexus-network`.
*   **Purpose**: Allows services to talk to each other using their service names (e.g., `http://auth-service:4000`) instead of IP addresses.
*   **Isolation**: Front-facing services (Gateway) are exposed to your host machine, while internal services (AI, ATS) can be kept private within the network.

### B. Databases (Shared Infrastructure)
*   **MongoDB**: Persistent storage for users, resumes, and tracking data.
    *   `volumes: - mongodb_data:/data/db`: Ensures data isn't lost when the container stops.
*   **Redis**: High-speed in-memory store.
    *   Used for **Rate Limiting** in the Gateway to prevent API abuse.

### C. Service Configuration Patterns
Every backend service follows a consistent Docker pattern:
```yaml
  service-name:
    build: ./path/to/service
    container_name: service-name
    ports:
      - "EXTERNAL:INTERNAL"
    volumes:
      - ./path/to/service:/app        # Hot-reloading: Syncs local code with container
      - /app/node_modules              # Prevents local node_modules from overwriting container deps
    environment:
      - PORT=XXXX
      - NEXUS_INTERNAL_SECRET=${NEXUS_INTERNAL_SECRET}
    networks:
      - nexus-network
```

---

## 🛡️ 3. The API Gateway Pattern (`backend/gateway`)

The Gateway is the "Bouncer" and "Receptionist" of the project. Every client request from the React frontend hits the Gateway first.

### Key Responsibilities:
1.  **Reverse Proxying**: Routes `/api/auth` to the `auth-service` and `/api/resume` to the `resume-generator`.
2.  **Security (Helmet)**: Sets HTTP headers to prevent common attacks (XSS, Clickjacking).
3.  **Performance (Compression)**: Gzips responses to reduce payload size.
4.  **Rate Limiting (Redis)**: Tracks requests per IP to prevent DDoS or AI quota exhaustion.

---

## 🛰️ 4. Shared "Secret" Mechanism (`NEXUS_INTERNAL_SECRET`)

To ensure that internal services (like `ai-service`) only accept requests coming from our `gateway` and not from random external actors, we use a shared secret.

1.  **Gateway Injection**: In `proxyRoutes.js`, the Gateway adds a special header:
    ```javascript
    onProxyReq: (proxyReq, req, res) => {
        proxyReq.setHeader('x-nexus-secret', process.env.NEXUS_INTERNAL_SECRET);
    }
    ```
2.  **Service Validation**: Every microservice has a middleware that checks if `req.headers['x-nexus-secret']` matches its environment variable. If it doesn't, the request is rejected with a `403 Forbidden`.

---

## 🛠️ Essential Commands for this Module

*   **Start the full stack**: `docker-compose up --build`
*   **Stop services**: `docker-compose down`
*   **View specific logs**: `docker-compose logs -f gateway`
*   **Check running containers**: `docker ps`
*   **Clean up unused volumes**: `docker volume prune`

---

### 📝 Practical Exercise
1.  Open [docker-compose.yml](microservices-ai-resume-builder/docker-compose.yml).
2.  Note how `gateway` depends on `mongodb` and `redis` using the `depends_on` property. This ensures databases start before the application logic.
3.  Look at the `volumes` section. The syntax `./backend/gateway:/app` is what allows you to change code in VS Code and see it update instantly inside the running container (Development Mode).
