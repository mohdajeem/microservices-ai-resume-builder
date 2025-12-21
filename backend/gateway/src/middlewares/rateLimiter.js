import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

// 1. Connect to Redis (Ensure you have Redis running locally or on Cloud)
const client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// 2. Create Limiter Factory
const createLimiter = (windowMs, max, message) => {
  return rateLimit({
    store: new RedisStore({
      sendCommand: (...args) => client.call(...args),
    }),
    windowMs, // Time window (e.g., 15 minutes)
    max, // Max requests per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: message || "Too many requests, please try again later." }
  });
};

// 3. Define Limits
export const authLimiter = createLimiter(15 * 60 * 1000, 10, "Too many login attempts."); // 10 per 15 min
export const aiLimiter = createLimiter(60 * 1000, 10, "AI limit reached. Wait 1 min."); // 10 per 1 min
export const generalLimiter = createLimiter(60 * 1000, 100, "Server busy.");