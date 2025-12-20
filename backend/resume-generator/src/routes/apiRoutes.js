import express from 'express';
import { 
    createProfile, 
    auditResume, 
    updateResumeVersion, 
    getResumeLatex,
    getUserResumes,
    getResumeById,
    getMasterProfile,
    updateMasterProfile,
    deleteResume,   // <--- New Import
    wipeUserData,    // <--- New Import
    createCoverLetter
} from '../controllers/resumeController.js';

import { validate, resumeSchema } from '../middlewares/validate.js';
import { checkAILimit } from '../middlewares/usageMiddleware.js';

const router = express.Router();

// 1. Create Profile + Base Resume
router.post('/create', validate(resumeSchema), createProfile);
router.get('/list', getUserResumes);         // <-- Dashboard List (Fast)
router.get('/detail/:id', getResumeById);    // <-- Load Editor

// router.post('/create', createProfile);

// 2. AI Audit (Get Suggestions)
router.post('/audit', checkAILimit, auditResume);

router.post('/cover-letter', checkAILimit, createCoverLetter);

// 3. Update Version (Implement Suggestions)
router.put('/update/:id', updateResumeVersion);

// 4. Fetch LaTeX (For PDF Compiler)
router.get('/latex/:id', getResumeLatex);

// --- Master Profile Operations ---
router.get('/profile', getMasterProfile);    // <-- Get Global Data
router.put('/profile', updateMasterProfile); // <-- Update Global Data

router.delete('/delete/:id', deleteResume); // DELETE /resume/delete/:id
router.delete('/wipe', wipeUserData);       // DELETE /resume/wipe

export default router;