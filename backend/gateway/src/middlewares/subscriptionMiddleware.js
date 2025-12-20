export const checkTier = (requiredTier) => (req, res, next) => {
  // 1. Get User from Request (Attached by verifyToken middleware)
  const user = req.user;

  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const plan = user.plan || 'free'; // Default to free if missing

  // 2. Define Hierarchy
  const tiers = {
    'free': 0,
    'pro': 1,
    'ultimate': 2
  };

  // 3. Check Access
  if (tiers[plan] < tiers[requiredTier]) {
    return res.status(403).json({ 
      error: `This feature requires the ${requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1)} plan.`,
      upgradeUrl: "/pricing"
    });
  }

  next();
};