import { parsePdfInWorker } from "../scoring/workerClient.js";
import { aiClient } from "../ai/aiClient.js";
import { calculateBasicScore } from "../scoring/fallback.js";
import ATSResult from "../models/ATSResult.js";
import crypto from "crypto";

export const analyzeResume = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const { jd, resumeId } = req.body;

    // 1. Validation
    if (!req.file) {
      return res.status(400).json({ error: "No PDF uploaded" });
    }
    if (!jd) {
      return res.status(400).json({ error: "No Job Description provided" });
    }

    // 2. Cache Check (Avoid re-analyzing same JD for same Resume version)
    const jdHash = crypto.createHash('sha256').update(jd).digest('hex');
    const isRecalculate = req.query.recalculate === 'true';
    
    if (resumeId && !isRecalculate) {
      const existingScan = await ATSResult.findOne({ resumeId, jdHash });
      if (existingScan) {
        console.log(`[ATS-SERVICE] ⚡ Analysis Cache Hit for resumeId: ${resumeId}`);
        return res.json({
          success: true,
          cached: true,
          data: {
            ats_score: existingScan.score,
            ...existingScan.analysis
          }
        });
      }
    }

    // 3. Parse PDF using Worker Thread (Scalable)
    const { text: resumeText }= await parsePdfInWorker(req.file.buffer);

    // 4. AI Analysis via AI Orchestrator
    let aiResponse = null;
    try {
      aiResponse = await aiClient.generate("ATS_SCAN", {
        resumeText: resumeText,
        jobDescription: jd,
      }, null, isRecalculate); // Pass recalculate flag as bypassCache
    } catch (aiError) {
      console.error("⚠️ AI Orchestrator failed, using fallback:", aiError.message);
    }

    // 5. Fallback (If AI fails or returns null)
    if (!aiResponse) {
      aiResponse = calculateBasicScore(resumeText, jd);
    }

    // 6. Save To History for one-to-many JD tracking
    const newScan = new ATSResult({
      userId,
      resumeId,
      jdText: jd,
      jdTitle: jd.split('\n')[0].substring(0, 50).trim() || 'Untitled Job',
      jdHash: jdHash,
      score: aiResponse.ats_score,
      analysis: {
        summary: aiResponse.summary,
        strengths: aiResponse.strengths,
        improvements: aiResponse.improvements,
        keywords_found: aiResponse.keywords_found || [],
        keywords_missing: aiResponse.keywords_missing || []
      },
      match_gap: {
        skills: aiResponse.match_gap?.skills || 0,
        experience: aiResponse.match_gap?.experience || 0,
        education: aiResponse.match_gap?.education || 0,
        culture: aiResponse.match_gap?.culture || 0
      }
    });

    await newScan.save();

    res.json({
      success: true,
      data: {
        ...aiResponse,
        scanId: newScan._id // Return the scan ID so frontend knows it's saved
      }
    });

  } catch (error) {
    console.error("ATS Analysis Error:", error.message);
    res.status(500).json({ error: "Processing failed", details: error.message });
  }
};

// 1.5 Generate Tailored Summary
export const generateTailoredSummary = async (req, res) => {
  try {
    const { resumeText, jobDescription } = req.body;
    
    if (!resumeText || !jobDescription) {
      return res.status(400).json({ error: "Missing resumeText or jobDescription" });
    }

    const aiResponse = await aiClient.generate("TAILORED_SUMMARY", {
      resumeText,
      jobDescription
    });

    res.json({
      success: true,
      data: aiResponse // This is raw string returned by orchestrator
    });
  } catch (error) {
    console.error("Tailored Summary Error:", error.message);
    res.status(500).json({ error: "Failed to generate summary" });
  }
}

// 1.5 SMART SKILL EXTRACTION
export const getSmartSkills = async (req, res) => {
  try {
    const { skills, jobDescription } = req.body;

    if (!skills || !jobDescription) {
      return res.status(400).json({ error: "Missing skills or jobDescription" });
    }

    const aiResponse = await aiClient.generate("SMART_SKILLS", {
      resumeSkills: skills,
      jobDescription
    });

    res.json({
      success: true,
      data: aiResponse
    });
  } catch (error) {
    console.error("Smart Skills Error:", error.message);
    res.status(500).json({ error: "Failed to extract skills" });
  }
}

// 2. Fetch Scan History for a specific Resume Version
export const getScanHistory = async (req, res) => {
  try {
    const { resumeId } = req.params;
    const userId = req.headers['x-user-id'];
    
    console.log(`[ATS-SERVICE] 🔍 Fetching history for resumeId: ${resumeId}, userId: ${userId}`);

    if (!resumeId) {
      return res.status(400).json({ error: "Missing resumeId" });
    }

    // Find all scans for this resume + user, sorted by newest first
    const scans = await ATSResult.find({ resumeId })
      .select('score analysis jdText jdTitle createdAt match_gap') // Added jdTitle
      .sort({ createdAt: -1 });
    
    console.log(`[ATS-SERVICE] ✅ Found ${scans.length} scans`);

    res.json({
      success: true,
      count: scans.length,
      data: scans
    });

  } catch (error) {
    console.error("Fetch History Error:", error.stack);
    res.status(500).json({ error: "Failed to fetch history", details: error.message });
  }
};

// 3. Delete a specific Scan result
export const deleteScan = async (req, res) => {
  try {
    const { scanId } = req.params;
    const userId = req.headers['x-user-id'];

    const result = await ATSResult.findOneAndDelete({ _id: scanId, userId });
    
    if (!result) {
      return res.status(404).json({ error: "Scan not found or unauthorized" });
    }

    res.json({ success: true, message: "Scan deleted" });
  } catch (error) {
    res.status(500).json({ error: "Delete failed" });
  }
};
