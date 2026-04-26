import express from 'express';
import multer from 'multer';
import { 
  analyzeResume, 
  getScanHistory, 
  deleteScan, 
  generateTailoredSummary,
  getSmartSkills
} from '../controllers/atsController.js';
import { parseResume } from '../controllers/parserController.js';
import { requireInternal } from '../middleware/requireInternal.js';

const router = express.Router();

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } 
});

router.use(requireInternal);

router.post('/analyze', upload.single('resume'), analyzeResume);
router.post('/parse', upload.single('resume'), parseResume);
router.post('/tailored-summary', generateTailoredSummary);
router.post('/smart-skills', getSmartSkills);

// NEW HISTORY ROUTES
router.get('/history/:resumeId', getScanHistory);
router.delete('/history/:scanId', deleteScan);

export default router;
