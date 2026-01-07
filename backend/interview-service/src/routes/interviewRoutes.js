import express from 'express';
import { startSession, handleChat } from '../controllers/sessionController.js';

const router = express.Router();

router.post('/start', startSession);
router.post('/chat', handleChat);

export default router;