import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  // --- Core Identity (Auth Service) ---
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  
  // --- Billing (Payment Service) ---
  customerId: { type: String }, // Stripe Customer ID
  
  subscription: {
    plan: { 
      type: String, 
      enum: ['free', 'pro', 'ultimate'], 
      default: 'free' 
    },
    status: { 
      type: String, 
      enum: ['active', 'past_due', 'canceled'], 
      default: 'active' 
    },
    periodEnd: Date
  },
  
  // --- Limits & Quotas (Resume Service) ---
  usage: {
    aiGenerations: { type: Number, default: 0 },
    lastResetDate: { type: Date, default: Date.now }
  }
}, { 
  timestamps: true,
  collection: 'users' // Explicitly force all services to use the same collection
});

export default mongoose.model('User', UserSchema);