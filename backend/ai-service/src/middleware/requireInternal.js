/**
 * Middleware to ensure the request is coming from an internal source (API Gateway).
 * It verifies the 'x-nexus-secret' header against our internal secret.
 */
export const requireInternal = (req, res, next) => {
    const internalSecret = process.env.NEXUS_INTERNAL_SECRET;
    const incomingSecret = req.headers['x-nexus-secret'];
  
    if (!incomingSecret || incomingSecret !== internalSecret) {
      console.warn(`🛑 Unauthorized internal access attempt: ${req.method} ${req.url}`);
      return res.status(403).json({ error: "Access denied. Internal service only." });
    }
  
    next();
  };

export default requireInternal;