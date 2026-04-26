import express from 'express';
import { createCheckoutSession, handleWebhook } from '../controllers/paymentController.js';
import { requireInternal } from '../middleware/requireInternal.js';

const router = express.Router();

// 1. Internal Route (Checkout Session)
router.post('/create-checkout-session', requireInternal, express.json(), createCheckoutSession);

// 2. Public Route (Stripe Webhook)
// Webhook needs RAW body, handled in server.js or here
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

export default router;