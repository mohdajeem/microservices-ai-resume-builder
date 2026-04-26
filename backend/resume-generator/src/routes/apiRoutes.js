import express from 'express';
import { 
    createProfile, 
    auditResume, 
    aiCompactResume, // <--- New Import
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
import { requireInternal } from '../middlewares/requireInternal.js';

const router = express.Router();

// Apply requireInternal to protect routes from direct access outside the gateway
router.use(requireInternal);

// 1. Create Profile + Base Resume
router.post('/create', validate(resumeSchema), createProfile);
router.get('/list', getUserResumes);         // <-- Dashboard List (Fast)
router.get('/detail/:id', getResumeById);    // <-- Load Editor

console.log("[RESUME-ROUTES] Registering /audit POST route");
// router.post('/create', createProfile);

// 2. AI Audit (Get Suggestions)
// router.post('/audit', checkAILimit, auditResume);
router.post('/audit', auditResume);

// 2.1 AI Compaction (One-Way Rewrite)
console.log("[RESUME-ROUTES] Registering /compact-ai/:id POST route");
router.post('/compact-ai/:id', (req, res, next) => {
    console.log(`[RESUME-ROUTES DEBUG] Hit /compact-ai/:id with ID: ${req.params.id}`);
    next();
}, aiCompactResume);


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