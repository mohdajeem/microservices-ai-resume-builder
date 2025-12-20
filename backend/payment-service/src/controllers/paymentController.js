import Stripe from 'stripe';
import User from '../models/User.js';
import dotenv from 'dotenv';
dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Map your plans to Stripe Price IDs
const PLANS = {
  'pro': process.env.STRIPE_PRICE_PRO,
  'ultimate': process.env.STRIPE_PRICE_ULTIMATE
};

// 1. Create Checkout Session
export const createCheckoutSession = async (req, res) => {
  try {
    const { plan } = req.body;
    const userId = req.headers['x-user-id']; // From Gateway
    const userEmail = req.headers['x-user-email'];

    if (!PLANS[plan]) return res.status(400).json({ error: "Invalid plan" });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: PLANS[plan],
          quantity: 1,
        },
      ],
      customer_email: userEmail, // Pre-fill email
      metadata: {
        userId: userId, // CRITICAL: Pass UserID to webhook
        targetPlan: plan
      },
      success_url: `${process.env.FRONTEND_URL}/dashboard?payment=success`,
      cancel_url: `${process.env.FRONTEND_URL}/pricing?payment=canceled`,
    });

    res.json({ url: session.url });

  } catch (error) {
    console.error("Stripe Error:", error);
    res.status(500).json({ error: error.message });
  }
};

// 2. Handle Webhook (Stripe calls this, not your Frontend)
export const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Verify request comes from Stripe
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { userId, targetPlan } = session.metadata;

    console.log(`💰 Payment successful for User ${userId}. Upgrading to ${targetPlan}`);

    // Update Database
    await User.findByIdAndUpdate(userId, {
      'subscription.plan': targetPlan,
      'subscription.status': 'active',
      'customerId': session.customer,
      // Reset AI credits on upgrade? Optional.
    });
  }

  res.json({ received: true });
};