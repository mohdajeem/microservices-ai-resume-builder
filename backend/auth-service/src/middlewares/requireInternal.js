// auth-service/src/middleware/requireInternal.js

export const requireInternal = (req, res, next) => {
    // 1. Check for the header
    const receivedSecret = req.headers['x-nexus-secret'];
    
    // 2. Compare it with the local env variable
    const expectedSecret = process.env.NEXUS_INTERNAL_SECRET;

    // 3. Security Check
    if (!receivedSecret || receivedSecret !== expectedSecret) {
        console.warn(`SECURITY ALERT: Unauthorized access attempt from IP: ${req.ip}`);
        return res.status(403).json({ 
            success: false, 
            message: "Access Denied: You are not the Gateway." 
        });
    }

    // 4. If match, let them in!
    next();
};