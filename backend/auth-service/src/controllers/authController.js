import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Check existing
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: "Email already exists" });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    // Generate JWT
    // const token = jwt.sign(
    //   { id: user._id, email: user.email }, 
    //   process.env.JWT_SECRET, 
    //   { expiresIn: '7d' }
    // );

    const token = jwt.sign(
      { 
        id: user._id, 
        email: user.email,
        plan: user.subscription.plan // <--- EMBED PLAN HERE
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );

    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// CHANGE PASSWORD
export const changePassword = async (req, res) => {
  try {
    const userId = req.headers['x-user-id']; // Injected by Gateway
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Verify old password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ error: "Incorrect current password" });

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE ACCOUNT
export const deleteAccount = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    
    // Note: The Frontend must call /resume/wipe BEFORE calling this.
    // Or we rely on the Gateway to chain them (complex). 
    // Frontend orchestration is safer for now.
    
    await User.findByIdAndDelete(userId);
    
    res.json({ success: true, message: "Account deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ... existing imports

// GET CURRENT USER (Fresh Data)
export const getMe = async (req, res) => {
  try {
    const userId = req.headers['x-user-id']; // Injected by Gateway
    const user = await User.findById(userId).select('-password'); // Exclude password
    
    if (!user) return res.status(404).json({ error: "User not found" });

    res.status(200).json({
      success: true,
      data: user
    }); // Returns { _id, name, email, subscription: { plan: 'ultimate' } }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};