import { aiClient } from './aiClient.js';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Performs a deep audit of the resume via AI Orchestrator.
 */
export const generateComprehensiveAudit = async (resumeData, jobDescription, atsImprovements = [], bypassCache = false, compactMode = false) => {
  try {
    const result = await aiClient.generate("RESUME_AUDIT", {
        resume: resumeData, // Orchestrator handles mapping to fullContextData
        jobDescription: jobDescription,
        atsImprovements: atsImprovements,
        compactMode: compactMode
    }, null, bypassCache);

    return result;
  } catch (error) {
    console.error("❌ Resume Audit AI Error:", error.message);
    throw error;
  }
};

/**
 * Generates a tailored Cover Letter based on Resume + JD.
 */
export const generateCoverLetter = async (resumeData, jobDescription) => {
  try {
    const result = await aiClient.generate("COVER_LETTER", {
        resume: resumeData,
        jobDescription: jobDescription
    });

    return result;
  } catch (error) {
    console.error("❌ Cover Letter AI Error:", error.message);
    throw error;
  }
};

/**
 * Compacts resume content using AI to fit one-page limit.
 */
export const compactResumeContent = async (resumeData) => {
  try {
    const result = await aiClient.generate("REWRITE_COMPACT", {
        resume: resumeData
    });

    // The Orchestrator returns { success: true, data: { experience: [], projects: [] } }
    // for non-standardized tasks or just the data if standardized.
    // REWRITE_COMPACT has schema: true so it returns the result directly.
    return result;
  } catch (error) {
    console.error("❌ Resume Compaction AI Error:", error.message);
    throw error;
  }
};