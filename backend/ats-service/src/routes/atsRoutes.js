import express from 'express';
import multer from 'multer';
import { analyzeResume } from '../controllers/atsController.js';
import { parseResume } from '../controllers/parserController.js';

const router = express.Router();

// 1. Configure Multer
// We use memoryStorage to keep the file in RAM for fast processing.
// Limit file size to 5MB to prevent DoS attacks.
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } 
});

// 2. Define Routes

// Route: POST /api/ats/analyze
// Desc:  Scoring Engine (Resume PDF + JD Text -> Score JSON)
router.post('/analyze', upload.single('resume'), analyzeResume);

// Route: POST /api/ats/parse
// Desc:  Extraction Engine (Resume PDF -> Master Profile JSON)
router.post('/parse', upload.single('resume'), parseResume);

export default router;