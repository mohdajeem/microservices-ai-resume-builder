# Rate Limiter - Deep Dive Learning Guide

## Table of Contents
1. [What is Rate Limiting?](#what-is-rate-limiting)
2. [Why Rate Limiting is Important](#why-rate-limiting-is-important)
3. [Types of Rate Limiting](#types-of-rate-limiting)
4. [Express Rate Limit Library](#express-rate-limit-library)
5. [All Parameters Explained in Depth](#all-parameters-explained-in-depth)
6. [Redis Store Integration](#redis-store-integration)
7. [Your Implementation Analysis](#your-implementation-analysis)
8. [Real-World Examples](#real-world-examples)
9. [Best Practices](#best-practices)

---

## What is Rate Limiting?

**Rate limiting** is a technique that controls the amount of traffic a user or client can send to your server within a specific time window. It's a form of **access control** that restricts the number of requests an API endpoint can receive from a single source (usually identified by IP address) within a given timeframe.

### Simple Analogy
Think of it like a ticket counter at a cinema:
- The counter can only serve a **limited number of people** (e.g., 10 people)
- Within a specific **time window** (e.g., 15 minutes)
- Once the limit is reached, new customers have to **wait** until the window resets

---

## Why Rate Limiting is Important

### 1. **Prevent DDoS Attacks**
- Protects your server from distributed denial-of-service attacks
- Prevents malicious actors from overwhelming your server with requests
- Example: Attacker sending 10,000 requests/second → Rate limiter blocks them

### 2. **Protect Against Brute Force Attacks**
- Limits login attempts to prevent password guessing
- Example: After 10 failed login attempts in 15 minutes, reject further attempts

### 3. **Ensure Fair Resource Distribution**
- Prevents one user from monopolizing server resources
- Ensures all users get fair access to the API
- Example: Prevent one user from consuming all AI processing capacity

### 4. **Cost Control**
- Prevents unexpected spikes in API usage that could increase bills
- Protects against runaway processes or bugs
- Example: Limit AI model calls to prevent excessive cloud compute charges

### 5. **Service Stability**
- Maintains server uptime and performance
- Prevents cascading failures
- Allows graceful degradation under heavy load

---

## Types of Rate Limiting

### 1. **IP-Based Rate Limiting** (Most Common)
Limits requests based on the client's IP address.
```javascript
// Every IP address gets 100 requests per minute
```
**Pros:** Simple, effective for most cases  
**Cons:** Doesn't work well behind proxies (multiple users behind same IP)

### 2. **User-Based Rate Limiting**
Limits requests based on authenticated user ID.
```javascript
// User ID: user123 gets 100 requests per minute
```
**Pros:** More accurate, handles proxy scenarios  
**Cons:** Requires authentication

### 3. **Endpoint-Based Rate Limiting**
Different limits for different endpoints.
```javascript
// POST /login → 10 requests per 15 minutes
// GET /data → 100 requests per minute
```

### 4. **Token Bucket Algorithm**
Requests are represented as tokens in a bucket.
```
Bucket capacity: 10 tokens
Refill rate: 1 token per 6 seconds
Each request costs 1 token
```

### 5. **Sliding Window Log**
Tracks exact timestamps of requests (more accurate but memory-intensive).

---

## Express Rate Limit Library

The `express-rate-limit` is a popular Node.js middleware for rate limiting Express applications.

### Installation
```bash
npm install express-rate-limit
npm install rate-limit-redis  # For Redis store
npm install ioredis            # Redis client
```

### How It Works
1. **Intercepts requests** → checks if client exceeded limit
2. **Tracks requests** → stores count in memory or Redis
3. **Blocks/Allows** → returns 429 status or allows request to proceed
4. **Resets** → clears counters after time window expires

---

## All Parameters Explained in Depth

### Core Parameters

#### 1. **`windowMs` (Time Window in Milliseconds)**

**What it is:** The time period for counting requests.

```javascript
windowMs: 15 * 60 * 1000  // 15 minutes in milliseconds
windowMs: 60 * 1000        // 1 minute
windowMs: 24 * 60 * 60 * 1000  // 24 hours
```

**How it works:**
- Every client gets a "fresh slate" after this time passes
- Request counter resets when window expires
- Uses **sliding window algorithm** internally

**Real-world examples:**
```javascript
// API calls: Allow 1000 requests per hour
windowMs: 60 * 60 * 1000

// Login attempts: Allow 5 attempts per day
windowMs: 24 * 60 * 60 * 1000

// Sensitive operations: Allow 10 per 5 minutes
windowMs: 5 * 60 * 1000
```

**⚠️ Important:** All values must be in **milliseconds**, not seconds!

---

#### 2. **`max` (Maximum Number of Requests)**

**What it is:** The maximum number of requests allowed per IP/user in the time window.

```javascript
max: 10      // 10 requests per window
max: 100     // 100 requests per window
max: 1000    // 1000 requests per window
```

**Behavior:**
- Request count increments with each incoming request
- When count > max → request is rejected (429 status)
- Count resets after windowMs expires

**Calculation formula:**
```
Requests per second = max / (windowMs / 1000)

Example 1: max=100, windowMs=60*1000 (1 min)
Requests per second = 100 / 60 ≈ 1.67 req/sec

Example 2: max=10, windowMs=15*60*1000 (15 min)
Requests per second = 10 / 900 ≈ 0.011 req/sec
```

---

#### 3. **`store` (Data Storage Backend)**

**What it is:** Where rate limit counters are stored.

### Options:

**A. Memory Store (Default)**
```javascript
// No store property = uses in-memory storage
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
  // Stores data in Node.js RAM
});
```
**Pros:** Fast, no external dependency  
**Cons:** Data lost on server restart, doesn't scale across multiple servers

**B. Redis Store (Recommended for Production)**
```javascript
import Redis from 'ioredis';
import RedisStore from 'rate-limit-redis';

const client = new Redis('redis://localhost:6379');

const limiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => client.call(...args),
  }),
  windowMs: 15 * 60 * 1000,
  max: 100
});
```

**Why Redis is better:**
- **Persistent:** Data survives server restarts
- **Distributed:** Multiple servers share same rate limit state
- **Atomic operations:** No race conditions
- **Performance:** Redis is extremely fast
- **TTL support:** Automatic expiration of old data

**Redis Configuration:**
```javascript
// Local Redis
const client = new Redis('redis://localhost:6379');

// Cloud Redis (e.g., Redis Cloud)
const client = new Redis(process.env.REDIS_URL);

// With password
const client = new Redis({
  host: 'localhost',
  port: 6379,
  password: 'your-password'
});

// Connection options
const client = new Redis({
  host: 'localhost',
  port: 6379,
  retryStrategy: (times) => Math.min(times * 50, 2000),
  maxRetriesPerRequest: null,
  enableReadyCheck: false
});
```

---

#### 4. **`message` (Error Message)**

**What it is:** The message sent to the client when rate limit is exceeded.

```javascript
// Simple string
message: "Too many requests, please try again later."

// JSON response
message: { 
  error: "Rate limit exceeded",
  retryAfter: "10 seconds"
}

// Function (dynamic message)
message: (req, res) => {
  return `You have exceeded the rate limit. Retry after ${req.rateLimit.resetTime}`;
}
```

**When it's sent:**
- HTTP Status: **429 Too Many Requests**
- Body: Your custom message
- HTTP Headers include: `Retry-After`, `RateLimit-*` headers

**Example Response:**
```
Status: 429
Headers:
  Retry-After: 60
  RateLimit-Limit: 10
  RateLimit-Remaining: 0
  RateLimit-Reset: 1703000000

Body:
{
  "error": "Too many login attempts. Please try again later."
}
```

---

#### 5. **`standardHeaders` (Enable Standard Rate Limit Headers)**

**What it is:** Whether to return standard `RateLimit-*` headers.

```javascript
standardHeaders: true   // Include headers
standardHeaders: false  // Don't include headers
```

**When `true`, returns these headers:**
```
RateLimit-Limit: 10           // Max requests allowed
RateLimit-Remaining: 3        // Requests remaining
RateLimit-Reset: 1703000060   // Unix timestamp of reset
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 3
X-RateLimit-Reset: 1703000060
```

**Benefits:**
- Client knows how many requests they have left
- Client knows when limit resets
- Standardized header format (complies with IETF standards)

**Frontend can use this to:**
```javascript
const remaining = parseInt(response.headers['ratelimit-remaining']);
if (remaining < 5) {
  console.warn('Approaching rate limit!');
}

const resetTime = parseInt(response.headers['ratelimit-reset']);
console.log(`Rate limit resets in ${resetTime - Date.now()/1000} seconds`);
```

---

#### 6. **`legacyHeaders` (Old Format Headers)**

**What it is:** Whether to return old `X-RateLimit-*` format headers.

```javascript
legacyHeaders: true   // Old format (deprecated)
legacyHeaders: false  // Don't include old format
```

**Legacy format (not recommended):**
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 3
X-RateLimit-Reset: 1703000060
```

**Modern approach:**
Use `standardHeaders: true` and `legacyHeaders: false`

---

### Advanced Parameters

#### 7. **`skip` (Skip Rate Limiting)**

**What it is:** Function to conditionally skip rate limiting for certain requests.

```javascript
skip: (req, res) => {
  // Skip rate limiting for admin users
  return req.user?.role === 'admin';
}

// Skip for specific routes
skip: (req, res) => {
  return req.path === '/health-check';
}

// Skip for localhost
skip: (req, res) => {
  return req.ip === '127.0.0.1';
}

// Multiple conditions
skip: (req, res) => {
  return req.user?.isPremium || req.ip === '127.0.0.1' || req.path.startsWith('/public');
}
```

**Use cases:**
- Health check endpoints
- Admin endpoints
- Premium user bypass
- Localhost testing

---

#### 8. **`keyGenerator` (Custom Key Generation)**

**What it is:** Function to generate the key for rate limiting (default is IP address).

```javascript
// Default: Uses client IP address
// keyGenerator: (req, res) => req.ip

// IP-based (default)
keyGenerator: (req, res) => {
  return req.ip; // or req.clientIp
}

// User-based (requires authentication)
keyGenerator: (req, res) => {
  return req.user?.id || req.ip; // Use user ID if authenticated, else IP
}

// Custom identifier
keyGenerator: (req, res) => {
  return `${req.ip}:${req.user?.id || 'anonymous'}`;
}

// API key based
keyGenerator: (req, res) => {
  return req.headers['x-api-key'] || req.ip;
}

// Device fingerprint based
keyGenerator: (req, res) => {
  const userAgent = req.headers['user-agent'];
  const fingerprint = crypto.createHash('md5').update(userAgent).digest('hex');
  return `${req.ip}:${fingerprint}`;
}
```

**Real-world scenarios:**

```javascript
// Different limits for different users
keyGenerator: (req, res) => {
  if (req.user?.isPremium) {
    return `premium:${req.user.id}`;
  }
  return `free:${req.ip}`;
}

// By team/organization
keyGenerator: (req, res) => {
  return req.headers['x-team-id'] || req.ip;
}
```

**Important:** Behind proxies, you may need:
```javascript
app.set('trust proxy', 1); // Trust proxy headers

keyGenerator: (req, res) => {
  return req.headers['x-forwarded-for'] || req.ip;
}
```

---

#### 9. **`handler` (Custom Response Handler)**

**What it is:** Function called when rate limit is exceeded.

```javascript
// Default handler sends 429 status with message
// You can customize it:

handler: (req, res) => {
  res.status(429).json({
    success: false,
    message: 'Rate limit exceeded',
    retryAfter: req.rateLimit.resetTime
  });
}

// Logging example
handler: (req, res) => {
  console.log(`Rate limit exceeded for IP: ${req.ip}`);
  res.status(429).json({
    error: 'Too many requests',
    remainingTime: req.rateLimit.resetTime - Date.now()
  });
}

// Send different response based on route
handler: (req, res) => {
  if (req.path.includes('/api/ai')) {
    return res.status(429).json({
      error: 'AI model is busy. Please try again later.',
      resetTime: new Date(req.rateLimit.resetTime)
    });
  }
  
  res.status(429).json({
    error: 'Rate limit exceeded'
  });
}
```

**`req.rateLimit` object:**
```javascript
{
  limit: 10,           // Max requests
  current: 10,         // Current request count
  remaining: 0,        // Remaining requests
  resetTime: 1703000060000  // Unix timestamp of reset
}
```

---

#### 10. **`statusCode` (HTTP Status Code)**

**What it is:** HTTP status code to return when limit exceeded.

```javascript
statusCode: 429  // Default: 429 Too Many Requests

// Alternative status codes
statusCode: 503  // Service Unavailable
statusCode: 400  // Bad Request (not recommended)
```

**Standard codes:**
- `429` - Too Many Requests (recommended, standard for rate limiting)
- `503` - Service Unavailable (alternative)

---

#### 11. **`onLimitReached` (Callback on Limit)**

**What it is:** Function called when a request is rejected due to rate limiting.

```javascript
onLimitReached: (req, res, options) => {
  console.log(`Rate limit reached for ${req.ip}`);
  // Send alert, log to database, etc.
}

// Advanced logging
onLimitReached: (req, res, options) => {
  const logEntry = {
    ip: req.ip,
    timestamp: new Date(),
    endpoint: req.path,
    userId: req.user?.id,
    attempts: req.rateLimit.current
  };
  
  database.log(logEntry); // Save to database
  
  if (req.rateLimit.current > 50) {
    alertAdmin(`Suspicious activity from ${req.ip}`);
  }
}
```

---

#### 12. **`requestWasSuccessful` (Success Condition)**

**What it is:** Function determining if request counts against rate limit.

```javascript
// Count all requests (default)
requestWasSuccessful: (req, res) => true

// Only count failed requests
requestWasSuccessful: (req, res) => {
  return res.statusCode < 400;
}

// Don't count successful responses
requestWasSuccessful: (req, res) => {
  return res.statusCode >= 400;
}

// Custom logic
requestWasSuccessful: (req, res) => {
  // Don't count redirects
  return res.statusCode !== 301 && res.statusCode !== 302;
}
```

**Use case:** Only count failed login attempts, not successful ones
```javascript
// Login limiter: count only failures
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  requestWasSuccessful: (req, res) => {
    // If login failed, count it
    return res.statusCode !== 401;
  }
});
```

---

#### 13. **`skip` vs `skipSuccessfulRequests`**

```javascript
// Skip entirely (don't count, don't limit)
skip: (req, res) => req.user?.isAdmin

// Only count failures
skipSuccessfulRequests: true
// Counts only 4xx and 5xx responses
```

---

## Redis Store Integration

### How it Works

```javascript
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

const client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

const limiter = rateLimit({
  store: new RedisStore({
    // sendCommand: sends commands to Redis
    sendCommand: (...args) => client.call(...args),
    
    // Optional: prefix for Redis keys
    prefix: 'rl:',  // Rate limit keys stored as "rl:ipaddress"
    
    // Optional: expiration in seconds
    expiry: 60  // Auto-delete keys after 60 seconds
  }),
  windowMs: 15 * 60 * 1000,
  max: 100
});
```

### Redis Keys Structure

When using Redis, rate limit data is stored as:
```
Key: "rl:192.168.1.1:endpoint"
Value: 5  (number of requests)
TTL: 900  (15 minutes)

Example:
rl:192.168.1.1 → 7 (7 requests so far)
rl:203.0.113.42 → 2 (2 requests)
rl:198.51.100.5 → 1 (1 request)
```

### Benefits Over Memory Store

| Aspect | Memory Store | Redis Store |
|--------|--------------|-------------|
| **Persistence** | Lost on restart | Survives restarts |
| **Scaling** | Per-instance counts | Shared across instances |
| **Race Conditions** | Possible | Atomic operations |
| **Memory** | All in RAM | Distributed across servers |
| **Production Ready** | No | Yes |

---

## Your Implementation Analysis

Looking at your current rate limiter:

```javascript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

// Redis connection
const client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Factory function
const createLimiter = (windowMs, max, message) => {
  return rateLimit({
    store: new RedisStore({
      sendCommand: (...args) => client.call(...args),
    }),
    windowMs,              // Time window
    max,                   // Max requests
    standardHeaders: true, // Include RateLimit headers
    legacyHeaders: false,  // Don't include old X-RateLimit headers
    message: { error: message || "Too many requests, please try again later." }
  });
};

// Your limiters
export const authLimiter = createLimiter(15 * 60 * 1000, 10, "Too many login attempts.");
export const aiLimiter = createLimiter(60 * 1000, 10, "AI limit reached. Wait 1 min.");
export const generalLimiter = createLimiter(60 * 1000, 100, "Server busy.");
```

### Analysis

✅ **What you're doing right:**
1. **Using Redis** - Production-ready, scalable
2. **Factory pattern** - Reusable, DRY code
3. **Standard headers** - Client can check remaining requests
4. **Custom messages** - User-friendly error messages
5. **Different limits** - Sensitive operations (auth) have stricter limits

### Parameters Used:
| Parameter | Value | Purpose |
|-----------|-------|---------|
| `store` | RedisStore | Distributed, persistent storage |
| `windowMs` | 15min, 1min | Different time windows for different endpoints |
| `max` | 10, 100 | Stricter for auth, looser for general |
| `standardHeaders` | true | Include RateLimit-* headers |
| `legacyHeaders` | false | Modern approach, no deprecated headers |
| `message` | Custom | User-friendly error messages |

### Suggested Improvements

```javascript
const createLimiter = (windowMs, max, message, options = {}) => {
  return rateLimit({
    store: new RedisStore({
      sendCommand: (...args) => client.call(...args),
    }),
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { 
      error: message || "Too many requests, please try again later.",
      timestamp: new Date().toISOString()
    },
    
    // Skip admin users
    skip: (req, res) => {
      return req.user?.role === 'admin';
    },
    
    // Custom key for user-based limiting
    keyGenerator: (req, res) => {
      return req.user?.id || req.ip;
    },
    
    // Log rate limit events
    onLimitReached: (req, res, options) => {
      console.warn(`Rate limit exceeded: ${req.ip} on ${req.path}`);
    },
    
    // Custom status code
    statusCode: 429,
    
    ...options // Allow override in specific limiters
  });
};
```

---

## Real-World Examples

### Example 1: Login Endpoint
```javascript
// Very strict: 5 attempts per 15 minutes
const loginLimiter = createLimiter(15 * 60 * 1000, 5, "Too many login attempts. Try again later.");

app.post('/login', loginLimiter, (req, res) => {
  // Authenticate user
});
```

**User experience:**
- First 5 attempts: Success or fail normally
- 6th attempt: Returns 429, message: "Too many login attempts"
- After 15 minutes: Counter resets, can try again

---

### Example 2: API Endpoint with Premium Users
```javascript
const apiLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => client.call(...args),
  }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: (req, res) => {
    // Premium users: 10,000 requests/hour
    // Free users: 100 requests/hour
    return req.user?.isPremium ? 10000 : 100;
  },
  keyGenerator: (req, res) => {
    return req.user?.id || req.ip;
  },
  message: (req, res) => {
    const limit = req.user?.isPremium ? 10000 : 100;
    return {
      error: `API limit exceeded. Limit: ${limit} per hour.`,
      limit: limit,
      remaining: req.rateLimit?.remaining
    };
  }
});

app.use('/api/', apiLimiter);
```

---

### Example 3: Progressive Backoff
```javascript
const progressiveBackoff = (windowMs, baseMax) => {
  return rateLimit({
    store: new RedisStore({
      sendCommand: (...args) => client.call(...args),
    }),
    windowMs,
    max: baseMax,
    
    // After being rate limited, increase backoff
    onLimitReached: async (req, res) => {
      const key = req.ip;
      const violations = await redis.incr(`violations:${key}`);
      
      if (violations > 3) {
        // Ban for 1 hour after 3 violations
        await redis.setex(`banned:${key}`, 3600, '1');
      }
    },
    
    skip: async (req, res) => {
      const isBanned = await redis.exists(`banned:${req.ip}`);
      if (isBanned) {
        return res.status(403).json({ error: 'Temporarily banned' });
      }
      return false;
    }
  });
};
```

---

### Example 4: Sliding Window with Grace Period
```javascript
const aiAuditLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => client.call(...args),
  }),
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  
  // Alert user when approaching limit
  handler: (req, res) => {
    const remaining = req.rateLimit.remaining;
    
    if (remaining <= 2) {
      // Warn user
      res.set('X-Warning', `Only ${remaining} requests remaining`);
    }
    
    res.status(429).json({
      error: 'Rate limit exceeded',
      remaining: remaining,
      resetTime: new Date(req.rateLimit.resetTime)
    });
  }
});
```

---

## Best Practices

### 1. **Use Redis in Production**
```javascript
// ✅ DO: Use Redis
const store = new RedisStore({ 
  sendCommand: (...args) => client.call(...args) 
});

// ❌ DON'T: Use default memory store
// const limiter = rateLimit({ windowMs, max });
```

### 2. **Different Limits for Different Endpoints**
```javascript
// ✅ DO
app.post('/login', authLimiter, loginHandler);
app.post('/ai-audit', aiLimiter, aiHandler);
app.get('/data', generalLimiter, dataHandler);

// ❌ DON'T: Same limit for everything
app.use(generalLimiter);
```

### 3. **Provide Clear Error Messages**
```javascript
// ✅ DO: Helpful message with context
message: {
  error: "Too many login attempts",
  retryAfter: "15 minutes",
  tip: "Check your email for account recovery options"
}

// ❌ DON'T: Generic message
message: "Error"
```

### 4. **Include Standard Headers**
```javascript
// ✅ DO
standardHeaders: true,
legacyHeaders: false

// ❌ DON'T
standardHeaders: false,
legacyHeaders: true
```

### 5. **Log Rate Limit Events**
```javascript
// ✅ DO
onLimitReached: (req, res) => {
  logger.warn({
    type: 'RATE_LIMIT',
    ip: req.ip,
    endpoint: req.path,
    timestamp: new Date()
  });
},

// ❌ DON'T: Ignore events
```

### 6. **User-Based Limiting When Authenticated**
```javascript
// ✅ DO: Consider authentication
keyGenerator: (req, res) => {
  return req.user?.id || req.ip;
}

// ❌ DON'T: Only IP-based (fails with proxies)
```

### 7. **Handle Proxy Headers**
```javascript
// ✅ DO: Trust proxy in Express
app.set('trust proxy', 1);

// ❌ DON'T: Assume direct connection
// req.ip might be wrong behind proxy
```

### 8. **Set Reasonable Limits**
```javascript
// ✅ DO: Think about actual usage
// Users need ~100 API calls/hour for normal usage
max: 100,
windowMs: 60 * 60 * 1000

// ❌ DON'T: Arbitrary limits
max: 1,
windowMs: 1000
```

### 9. **Monitor and Alert**
```javascript
// ✅ DO
onLimitReached: async (req, res) => {
  const count = await redis.incr(`alerts:${req.ip}`);
  
  if (count > 100) {
    await alertSecurityTeam(`Suspicious: ${req.ip}`);
  }
}
```

### 10. **Allow Admin Bypass**
```javascript
// ✅ DO
skip: (req, res) => {
  return req.user?.role === 'admin';
}

// ❌ DON'T: Same limits for everyone
```

---

## Summary

**Rate limiting is crucial for:**
- Security (DDoS, brute force)
- Stability (resource management)
- Fairness (equal access)
- Cost control (cloud expenses)

**Your implementation is solid!** Using Redis with a factory pattern is the right approach. Consider adding:
- User-based limiting for authenticated users
- Admin bypass
- Better logging and alerts
- Monitoring dashboard

This will make your system more robust and production-ready.
