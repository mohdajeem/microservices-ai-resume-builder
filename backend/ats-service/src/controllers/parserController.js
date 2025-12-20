import { parsePdfInWorker } from '../scoring/workerClient.js'; 
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Use 1.5-flash for speed and lower cost, or 1.5-pro for better reasoning
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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
    
    // 2. The Enhanced Prompt
    const prompt = `
      You are an advanced AI Resume Parser. 
      Your task is to extract structured data from the provided resume text into a strict JSON format.

      CRITICAL RULES:
      1. **Links**: aggressively search for URLs (http, https, www, github.com, linkedin.com). 
         - If a project title mentions a link or a link is typically found near the title, extract it into the 'link' field.
         - Normalize URLs (e.g., remove trailing slashes).
      2. **Dates**: Format all dates as "Month Year" (e.g., "Jan 2024") or "Present".
      3. **Bullet Points**: Remove bullet characters (•, -, *) and clean up whitespace.
      4. **Inference**: If a field is missing (like location), infer it from the university or company context if possible. If impossible, leave it as an empty string "".
      5. **Skills**: Return skills as ARRAYS of strings, not long comma-separated strings.

      RESUME TEXT:
      ${rawText}

      ${linksContext}

      OUTPUT SCHEMA (Must match exactly):
      {
        "personalInfo": {
           "name": "string",
           "email": "string",
           "phone": "string",
           "linkedin": "string (Full URL)",
           "github": "string (Full URL)",
           "location": "string",
           "portfolio": "string (Full URL)"
        },
        "experience": [
           { 
             "company": "string", 
             "role": "string", 
             "duration": "string", 
             "location": "string", 
             "points": ["string", "string"] 
           }
        ],
        "projects": [
           { 
             "title": "string", 
             "tech": "string (e.g. 'React, Node.js')", 
             "link": "string (URL if found, else empty)", 
             "date": "string", 
             "points": ["string"] 
           }
        ],
        "education": [
           { "institute": "string", "duration": "string", "details": "string" }
        ],
        "skills": {
           "languages": ["string"],
           "frameworks": ["string"],
           "tools": ["string"],
           "databases": ["string"]
        },
        "certifications": [ 
           { "name": "string", "link": "string (URL if found, else empty)" } 
        ],
        "achievements": [ 
           { "name": "string", "link": "string (URL if found, else empty)" } 
        ]
      }

      Return ONLY raw JSON. No Markdown formatting. No \`\`\`json blocks.
    `;

    // 3. Call AI
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    // Clean markdown (Safety net)
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const parsedData = JSON.parse(text);
    res.json({ success: true, data: parsedData });

  } catch (error) {
    console.error("Parsing Error:", error);
    res.status(500).json({ error: "Failed to parse resume", details: error.message });
  }
};