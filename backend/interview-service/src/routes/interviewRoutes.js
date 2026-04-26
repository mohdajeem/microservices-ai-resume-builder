import express from 'express';
import { startSession, handleChat } from '../controllers/sessionController.js';
import { requireInternal } from '../middlewares/requireInternal.js';

const router = express.Router();

router.use(requireInternal);

router.post('/start', startSession);
router.post('/chat', handleChat);

export default router;