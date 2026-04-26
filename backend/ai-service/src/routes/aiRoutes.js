import express from 'express';
import { handleAIRequest } from '../controllers/aiController.js';
import { requireInternal } from '../middleware/requireInternal.js';

const router = express.Router();

// Internal-only route
router.post('/generate', requireInternal, handleAIRequest);

export default router;