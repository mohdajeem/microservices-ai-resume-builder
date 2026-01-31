import { createProxyMiddleware } from 'http-proxy-middleware';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { aiLimiter, generalLimiter } from '../middlewares/rateLimiter.js';
import { checkTier } from '../middlewares/subscriptionMiddleware.js';

const setupProxies = (app) => {
    
    // ----------------------------------------------------------
    // 1. PROTECTED AUTH ROUTES (Change Pass, Delete Account)
    // ----------------------------------------------------------
    app.use(
        ['/api/auth/password', '/api/auth/me'], 
        verifyToken, 
        createProxyMiddleware({
            target: process.env.AUTH_SERVICE_URL || 'http://localhost:4000',
            changeOrigin: true,
            pathRewrite: { '^/api/auth': '' }, 
            onProxyReq: (proxyReq, req, res) => {
                // 1. Inject the VIP Wristband (Secret Key)
                proxyReq.setHeader('x-nexus-secret', process.env.NEXUS_INTERNAL_SECRET);
                if (req.user) {
                    proxyReq.setHeader('x-user-id', req.user.id); 
                }
            },
            onError: (err, req, res) => {
                console.error("Auth Service Error:", err.message);
                res.status(502).json({ error: "Auth Service Down" });
            }
        })
    );

    // ----------------------------------------------------------
    // 2. PUBLIC AUTH ROUTES (Login, Register)
    // ----------------------------------------------------------
    app.use(
        '/api/auth',
        generalLimiter,
        createProxyMiddleware({
            target: process.env.AUTH_SERVICE_URL || 'http://localhost:4000',
            changeOrigin: true,
            pathRewrite: { '^/api/auth': '' },
            onProxyReq: (proxyReq, req, res) => {
                // 1. Inject the VIP Wristband (Secret Key)
                proxyReq.setHeader('x-nexus-secret', process.env.NEXUS_INTERNAL_SECRET);
            },
            onError: (err, req, res) => res.status(502).json({ error: "Auth Service Down" })
        })
    );

    // ----------------------------------------------------------
    // 3. RESUME GENERATOR ROUTES
    // ----------------------------------------------------------

    // A. STRICT ROUTES (AI Audit) - AI Usage Gate
    app.use(
        '/api/resume/audit', 
        aiLimiter, 
        verifyToken,
        createProxyMiddleware({
            target: process.env.RESUME_GENERATOR_URL || 'http://localhost:5000',
            changeOrigin: true,
            pathRewrite: { '^/api/resume': '' },
            onProxyReq: (proxyReq, req, res) => {
                // 1. Inject the VIP Wristband (Secret Key)
                proxyReq.setHeader('x-nexus-secret', process.env.NEXUS_INTERNAL_SECRET);
                if (req.user) {
                    proxyReq.setHeader('x-user-id', req.user.id);
                    proxyReq.setHeader('x-user-plan', req.user.plan || 'free'); 
                }
            },
            onError: (err, req, res) => res.status(502).json({ error: "Resume Service Down" })
        })
    );

    // B. GENERAL ROUTES (List, Create, Update, PDF)
    app.use(
        '/api/resume', 
        generalLimiter, 
        verifyToken,
        createProxyMiddleware({
            target: process.env.RESUME_GENERATOR_URL || 'http://localhost:5000',
            changeOrigin: true,
            pathRewrite: { '^/api/resume': '' },
            onProxyReq: (proxyReq, req, res) => {
                // 1. Inject the VIP Wristband (Secret Key)
                proxyReq.setHeader('x-nexus-secret', process.env.NEXUS_INTERNAL_SECRET);
                if (req.user) {
                    proxyReq.setHeader('x-user-id', req.user.id);
                    proxyReq.setHeader('x-user-email', req.user.email);
                    proxyReq.setHeader('x-user-plan', req.user.plan || 'free');
                }
            },
            onError: (err, req, res) => res.status(502).json({ error: "Resume Service Down" })
        })
    );

    // ----------------------------------------------------------
    // 4. ATS SERVICE (Pro Feature) - Tier Gate
    // ----------------------------------------------------------
    app.use(
        '/api/ats',
        aiLimiter, 
        verifyToken,
        // checkTier('pro'), // <--- BLOCKS FREE USERS
        createProxyMiddleware({
            target: process.env.ATS_SERVICE_URL || 'http://localhost:7000',
            changeOrigin: true,
            pathRewrite: { '^/api/ats': '' },
            onProxyReq: (proxyReq, req, res) => {
                // Ensure headers are preserved for file uploads
                // 1. Inject the VIP Wristband (Secret Key)
                proxyReq.setHeader('x-nexus-secret', process.env.NEXUS_INTERNAL_SECRET);
                if (req.headers['content-type']) {
                    proxyReq.setHeader('Content-Type', req.headers['content-type']);
                }
                if (req.headers['content-length']) {
                    proxyReq.setHeader('Content-Length', req.headers['content-length']);
                }
                if (req.user) proxyReq.setHeader('x-user-id', req.user.id);
            },
            onError: (err, req, res) => res.status(502).json({ error: "ATS Service Down" })
        })
    );

    // ----------------------------------------------------------
    // 5. COMPILER SERVICE (Pro Feature) - Tier Gate
    // ----------------------------------------------------------
    app.use(
        '/api/compiler',
        generalLimiter,
        verifyToken,
        // checkTier('pro'), // Uncomment to enforce payment for PDF
        createProxyMiddleware({
            target: process.env.LATEX_COMPILER_URL || 'http://localhost:6000',
            changeOrigin: true,
            pathRewrite: { '^/api/compiler': '' },
            onProxyReq: (proxyReq, req, res) => {
                // 1. Inject the VIP Wristband (Secret Key)
                proxyReq.setHeader('x-nexus-secret', process.env.NEXUS_INTERNAL_SECRET);
            },
            onError: (err, req, res) => res.status(502).json({ error: "Compiler Service Down" })
        })
    );


    // KEEP THESE TWO SPECIFIC BLOCKS:

    // A. PAYMENT - CHECKOUT (Protected - Needs Token)
    // This injects the User ID so the Payment Service knows who is buying
    app.use(
        '/api/payment/create-checkout-session',
        verifyToken, 
        createProxyMiddleware({
            target: process.env.PAYMENT_SERVICE_URL || 'http://localhost:9000',
            changeOrigin: true,
            pathRewrite: { '^/api/payment': '' }, // Becomes /create-checkout-session
            onProxyReq: (proxyReq, req, res) => {
                // 1. Inject the VIP Wristband (Secret Key)
                proxyReq.setHeader('x-nexus-secret', process.env.NEXUS_INTERNAL_SECRET);
                if (req.user) {
                    proxyReq.setHeader('x-user-id', req.user.id);
                    proxyReq.setHeader('x-user-email', req.user.email);
                }
            },
            onError: (err, req, res) => res.status(502).json({ error: "Payment Service Down" })
        })
    );

    // B. PAYMENT - WEBHOOK (Public - No Token)
    // Stripe calls this directly, so we cannot check for a User Token
    app.use(
        '/api/payment/webhook',
        createProxyMiddleware({
            target: process.env.PAYMENT_SERVICE_URL || 'http://localhost:9000',
            changeOrigin: true,
            pathRewrite: { '^/api/payment': '' }, // Becomes /webhook
            onProxyReq: (proxyReq, req, res) => {
                // 1. MUST Inject the Secret (Even for public webhooks!)
                // The Payment Service trusts the Gateway, not Stripe directly.
                proxyReq.setHeader('x-nexus-secret', process.env.NEXUS_INTERNAL_SECRET);
            },
            onError: (err, req, res) => res.status(502).json({ error: "Payment Service Down" })
        })
    );

    // --- 7. INTERVIEW SERVICE ---
    app.use(
        '/api/interview',
        verifyToken, // Protect this route!
        createProxyMiddleware({
            target: process.env.INTERVIEW_SERVICE_URL || 'http://localhost:8001',
            changeOrigin: true,
            pathRewrite: { '^/api/interview': '' },
            onProxyReq: (proxyReq, req, res) => {
                if (req.user) proxyReq.setHeader('x-user-id', req.user.id);
            }
        })
    );
    
};

export default setupProxies;