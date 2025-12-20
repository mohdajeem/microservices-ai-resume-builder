import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export async function analyzeWithGemini(resumeText, jobDescription) {
  const prompt = `
    Role: ATS Scanner.
    Task: Compare the Candidate Resume against the Job Description.
    
    JOB DESCRIPTION:
    ${jobDescription}
    
    RESUME TEXT:
    ${resumeText}
    
    Strictly output VALID JSON (no markdown):
    {
      "ats_score": number (0-100),
      "summary": "Professional summary of fit (max 2 sentences)",
      "strengths": ["List of 3-4 key matching skills"],
      "improvements": ["List of 3-4 missing keywords or weak areas"]
    }
  `;

  try {
    // console.log("gemini api key in /analyseWithGemini: ", process.env.GEMINI_API_KEY);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // 🧹 Clean markdown code blocks if Gemini adds them
    text = text.replace(/```json|```/g, "").trim();

    return JSON.parse(text);
  } catch (error) {
    console.error("⚠️ Gemini API Error:", error.message);
    return null; // Return null to trigger fallback
  }
}