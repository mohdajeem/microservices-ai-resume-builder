# Module 2: Deep Dive into Authentication & Cryptographic Identity

In this module, we are deconstructing how your system verifies "Who is this user?" and how that identity is securely passed across your microservices.

---

## 1. Fundamental Mechanics: Stateless vs. Stateful Auth

Your project uses **Stateless Authentication** via JWT (JSON Web Tokens).

### The "Stateful" Way (Sessions):
1.  Server creates a `Session ID`.
2.  Stores it in **Memory/Redis/DB**.
3.  Sends ID to client via Cookie.
4.  **Problem:** Every microservice would need to query the *same* session database to verify the user $O(n)$ or $O(log n)$, creating a bottleneck.

### The "Stateless" Way (JWT):
1.  Server signs a payload with a **Private Secret**.
2.  Sends the token to the client.
3.  Client sends it back in the `Authorization` header.
4.  **Internal Logic:** Any service with the **Secret** can verify the token mathematically *without* querying a database. This turns a DB lookup into a CPU-bound cryptographic check.

---

## 2. API & Function Deep-Dive: `jsonwebtoken` and `bcryptjs`

### `jwt.sign(payload, secret, options)`
In [authController.js](../../backend/auth-service/src/controllers/authController.js):
-   **Payload:** `{ id: user._id, email: user.email, plan: ... }`. 
    -   *Crucial:* Never put passwords or sensitive data here because the payload is only Base64 encoded, **not encrypted**. Anyone can read it.
-   **Secret:** Used to create the HMAC (Hash-based Message Authentication Code). 
    -   If a hacker gets your `JWT_SECRET`, they can forge tokens for any user and act as an admin.
-   **expiresIn:** Sets the `exp` claim. After this timestamp, `jwt.verify` will throw a `TokenExpiredError`.

### `bcrypt.hash(password, saltRounds)`
-   **SaltRounds (10):** This is the "Work Factor." 
-   **Mathematical Internals:** Bcrypt uses the Eksblowfish algorithm. It incorporates a **Salt** (random data) so that even if two users have the password "123456", their hashes will be completely different.
-   **Key Stretching:** It runs the hash function $2^{10} = 1024$ times. This is designed to be slow to prevent GPU-accelerated brute-force attacks.

---

## 3. Tool Internals: The Signature Math ($S$)

A JWT has three parts: `Header.Payload.Signature`.

1.  **Header:** `{ "alg": "HS256", "typ": "JWT" }` $\xrightarrow{Base64}$ `eyJhbGci...`
2.  **Payload:** `{ "id": "123" }` $\xrightarrow{Base64}$ `eyJpZCI...`
3.  **Signature:** 
    $Signature = HMACSHA256(Base64(Header) + "." + Base64(Payload), Secret)$

The Gateway verifies this by re-calculating the signature using the `Secret` it holds. If its calculation matches the signature on the token, the request is "Authentic."

---

## 4. Edge Case Analysis: "The Identity Gap"

1.  **The "Revocation" Problem:** Since JWTs are stateless, you cannot "log out" a user immediately if their account is compromised. The token is valid until it expires.
    -   *Fix:* Use short-lived Access Tokens (15m) and long-lived Refresh Tokens (stored in DB/Redis).
2.  **Secret Leakage:** If your `NEXUS_INTERNAL_SECRET` is leaked, a malicious actor can bypass the Gateway and call the `auth-service` or `resume-generator` directly, pretending to be any `userId`.
3.  **Clock Skew:** If the Gateway's system clock is 10 minutes ahead of the Auth service, a token generated "just now" might be rejected by the Gateway as "Not yet valid" or "Expired" unexpectedly.

---

## 5. Hands-on Drill: "The Plan Upgrader"

Currently, the `auth-service` embeds the `plan` (free/pro) inside the JWT payload.

**Task:**
1.  Go to [authController.js](../../backend/auth-service/src/controllers/authController.js).
2.  Modify the `login` function to include a new claim: `iat` (Issued At) manually using `Math.floor(Date.now() / 1000)`.
3.  Update the Gateway's `verifyToken` middleware (locate it in `backend/gateway/src/middlewares/authMiddleware.js`) to log a warning if the token was issued more than 24 hours ago, even if it hasn't expired yet.

---

## 6. The Interrogator’s List (Interview Prep)

1.  What is the difference between **Authentication** and **Authorization**?
2.  Explain why we should use `bcrypt` instead of `SHA-256` for storing passwords.
3.  How does a **Rainbow Table** attack work, and how does **Salting** stop it?
4.  In a JWT, what is the difference between `HS256` (Symmetric) and `RS256` (Asymmetric) signing?
5.  Why is it dangerous to store a JWT in `localStorage` vs. an `httpOnly` cookie?
6.  Explain the concept of **Identity Propagation** in your Gateway-to-Service flow.
7.  What is a **Replay Attack**, and how can the `jti` (JWT ID) claim help prevent it?
8.  If you change a user's role from "user" to "admin", why does the user often have to log out and log back in?
9.  Explain the math behind "Key Stretching." Why $100ms$ of hashing time is better than $1\mu s$ for security.
10. How would you implement a "Global Logout" (Invalidate all tokens) in your current stateless architecture?

---

**Next Step:** Once you have completed the drill and reviewed the cryptographic math, say **"Proceed"** to move to **Module 3: Database Internals & Data Integrity**.
