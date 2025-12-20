import express from 'express';
import { createCheckoutSession, handleWebhook } from '../controllers/paymentController.js';

const router = express.Router();

// Route: POST /api/payment/create-checkout-session
router.post('/create-checkout-session', express.json(), createCheckoutSession);

// Route: POST /api/payment/webhook
// Note: Webhook needs RAW body, handled in server.js or here
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

export default router;