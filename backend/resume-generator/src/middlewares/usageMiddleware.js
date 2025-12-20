import User from '../models/User.js'; // You might need to copy User.js model to this service

export const checkAILimit = async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'];
    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ error: "User not found" });

    const plan = user.subscription.plan;

    // 1. Ultimate Users: No Limits
    if (plan === 'ultimate') return next();

    // 2. Free Users: Block AI
    if (plan === 'free') {
      return res.status(403).json({ error: "AI Features require Pro plan." });
    }

    // 3. Pro Users: Check Daily Limit
    const today = new Date();
    const lastReset = new Date(user.usage.lastResetDate);

    // Reset counter if it's a new day
    if (today.getDate() !== lastReset.getDate() || today.getMonth() !== lastReset.getMonth()) {
      user.usage.aiGenerations = 0;
      user.usage.lastResetDate = today;
    }

    if (user.usage.aiGenerations >= 50) {
      return res.status(403).json({ error: "Daily AI limit reached (50/50). Upgrade to Ultimate for unlimited access." });
    }

    // Increment Usage
    user.usage.aiGenerations += 1;
    await user.save();

    next();
  } catch (error) {
    console.error("Usage Check Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};