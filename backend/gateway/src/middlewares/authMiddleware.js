import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
    // 1. Get Token
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: "Access Denied. No token provided." });
    }

    try {
        // 2. Verify
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        
        // 3. Attach User Info to Request Object (So Proxy can see it)
        req.user = verified;
        
        next(); // Proceed to the Proxy
    } catch (error) {
        res.status(400).json({ error: "Invalid Token" });
    }
};