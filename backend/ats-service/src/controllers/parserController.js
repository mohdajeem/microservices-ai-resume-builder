import { parsePdfInWorker } from '../scoring/workerClient.js'; 
import { aiClient } from "../ai/aiClient.js";
import dotenv from 'dotenv';
dotenv.config();

export const parseResume = async (req, res) => {
  try {
    if (!req.file && !req.body.text) {
      return res.status(400).json({ error: "No file or text provided" });
    }

    // 1. Get Raw Text
    let rawText = req.body.text || "";
    let extractedLinks = [];
    if (req.file) {
      // rawText = await parsePdfInWorker(req.file.buffer);
      const result = await parsePdfInWorker(req.file.buffer);
      rawText = result.text;
      extractedLinks = result.links;
    }

    const linksContext = extractedLinks.length > 0
      ? `\n\n[HIDDEN HYPERLINKS FOUND IN DOCUMENT]:\n${extractedLinks.map(l => `- ${l.url}`).join('\n')}`
      : "";
    
    // 2. Call AI Orchestrator
    try {
      console.log(`[ATS-SERVICE] 🚀 Sending Resume Data to AI Orchestrator (Length: ${rawText.length})`);
      const response = await aiClient.generate("RESUME_PARSE", {
        resumeText: rawText,
        linksContext: linksContext
      });
      
      console.log(`[ATS-SERVICE] ✅ AI Orchestrator RAW Response:`, JSON.stringify(response).substring(0, 100));

      // Case 1: AI Result is already in { success: true, data: {...} } format
      if (response && response.success === true) {
          return res.json(response);
      }

      // Case 2: AI Result is flat (e.g. { personalInfo: ... })
      if (response && (response.personalInfo || response.experience)) {
          console.log(`[ATS-SERVICE] 🛠️  Wrapping flat response in success object`);
          return res.json({ success: true, data: response });
      }

      // Fallback: If success is undefined but we have some response, consider it success
      return res.json({ success: true, data: response });
    } catch (aiError) {
      console.error("⚠️ AI Parsing failed:", aiError.message);
      res.status(500).json({ error: "AI Parsing failed", details: aiError.message });
    }
  } catch (error) {
    console.error("Parsing Error:", error);
    res.status(500).json({ error: "Failed to parse resume", details: error.message });
  }
};