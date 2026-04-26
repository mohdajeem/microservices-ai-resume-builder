export const requireInternal = (req, res, next) => {
    const receivedSecret = req.headers['x-nexus-secret'];
    const expectedSecret = process.env.NEXUS_INTERNAL_SECRET;

    if (!receivedSecret || receivedSecret !== expectedSecret) {
        console.warn(`SECURITY ALERT: Unauthorized access attempt to Interview Service from IP: ${req.ip}`);
        return res.status(403).json({ 
            success: false, 
            message: "Access Denied: You are not authorized to access this service directly." 
        });
    }

    next();
};

export default requireInternal;