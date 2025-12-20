// Import the Scalable Worker Client (Non-blocking PDF parsing)
import { parsePdfInWorker } from "../scoring/workerClient.js";
import { analyzeWithGemini } from "../ai/geminiClient.js";
import { calculateBasicScore } from "../scoring/fallback.js";

export const analyzeResume = async (req, res) => {
  try {
    // 1. Validation
    if (!req.file) {
      return res.status(400).json({ error: "No PDF uploaded" });
    }
    if (!req.body.jd) {
      return res.status(400).json({ error: "No Job Description provided" });
    }

    const jobDescription = req.body.jd;

    // 2. Parse PDF using Worker Thread (Scalable)
    // This prevents the main thread from freezing while reading large PDFs
    const { text: resumeText }= await parsePdfInWorker(req.file.buffer);

    // 3. AI Analysis
    let result = await analyzeWithGemini(resumeText, jobDescription);

    // 4. Fallback (If AI fails or returns null)
    if (!result) {
      result = calculateBasicScore(resumeText, jobDescription);
    }

    res.json(result);

  } catch (error) {
    console.error("ATS Analysis Error:", error.message);
    res.status(500).json({ error: "Processing failed", details: error.message });
  }
};