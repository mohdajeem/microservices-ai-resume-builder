import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// FIX: Use 1.5-flash and REMOVE the generationConfig that was causing the 400 Error
const model = genAI.getGenerativeModel({ 
    model: "gemini-2.0-flash"
});
/**
 * Performs a deep audit of the resume.
 * NOW INCLUDES: 
 * 1. Full Resume Context (Skills, Edu, Certs)
 * 2. Previous ATS Algorithm Feedback
 * 3. Suggestions for ALL sections
 */
export const generateComprehensiveAudit = async (resumeData, jobDescription, atsImprovements = []) => {
  try {
    // 1. Prepare Full Context
    const fullContextData = {
        personalInfo: resumeData.personalInfo || resumeData.PERSONALINFO,
        experience: resumeData.experience || resumeData.EXPERIENCE,
        projects: resumeData.projects || resumeData.PROJECTS,
        skills: resumeData.skills || resumeData.SKILLS,
        education: resumeData.education || resumeData.EDUCATION,
        certifications: resumeData.certifications || resumeData.CERTIFICATIONS,
        achievements: resumeData.achievements || resumeData.ACHIEVEMENTS
    };

    // 2. Construct ATS Context String
    let atsContextSection = "";
    if (atsImprovements && atsImprovements.length > 0) {
        atsContextSection = `
        [CRITICAL PRIORITY - AUTOMATED ATS FEEDBACK]
        The following specific issues were flagged by our algorithm. 
        You MUST provide specific "Fix Options" to resolve these:
        ${atsImprovements.map(issue => `- ${issue}`).join('\n')}
        `;
    }

    const prompt = `
      You are an elite ATS Resume Auditor and Career Coach.
      
      ---------------------------------------------------------
      1. TARGET JOB DESCRIPTION (JD):
      ${jobDescription}
      ---------------------------------------------------------
      
      ${atsContextSection}

      ---------------------------------------------------------
      3. CANDIDATE RESUME DATA:
      ${JSON.stringify(fullContextData)}
      ---------------------------------------------------------

      TASK:
      Perform a deep audit on the ENTIRE resume. Compare against the JD and ATS Feedback.
      Provide specific "Fix Options" that the user can click to accept.
      
      AUDIT CRITERIA:
      1. **ATS Fixes**: Prioritize fixing the "ATS Feedback" listed above.
      2. **Impact**: Rewrite passive bullet points into Power Statements (e.g., "Responsible for..." -> "Orchestrated...").
      3. **Skills**: specific suggestions to add/remove keywords in the Skills section.
      4. **Education**: Check if degree details need more context (e.g., "Relevant Coursework").

      OUTPUT FORMAT (Strict JSON, No Markdown):
      {
        "missingKeywords": ["List of hard skills still missing after your check"],
        
        "summary": { 
            "original": "string", 
            "suggestion": "string (Optimized)", 
            "reason": "Why?",
            "priority": "HIGH" 
        },

        "experience": [
            {
                "company": "string",
                "role": "string",
                "points_audit": [
                    {
                        "original": "Exact original text",
                        "suggestion": "Rewritten text",
                        "type": "IMPACT" | "GRAMMAR" | "KEYWORD",
                        "priority": "HIGH" | "MEDIUM" | "LOW",
                        "reason": "Explanation"
                    }
                ]
            }
        ],

        "projects": [
            {
                "title": "string",
                "points_audit": [
                    {
                        "original": "Exact original text",
                        "suggestion": "Rewritten text",
                        "type": "IMPACT" | "GRAMMAR" | "KEYWORD",
                        "priority": "HIGH" | "MEDIUM" | "LOW",
                        "reason": "Explanation"
                    }
                ]
            }
        ],

        "education": [
            {
                "institute": "string",
                "details_audit": {
                    "original": "Exact details string",
                    "suggestion": "Optimized details (e.g., added coursework or GPA format)",
                    "type": "FORMAT" | "CONTENT",
                    "priority": "LOW" | "MEDIUM",
                    "reason": "Explanation"
                }
            }
        ],

        "skills": {
            "languages_audit": {
                 "original": "string",
                 "suggestion": "string (Reordered or added keywords)",
                 "reason": "string",
                 "priority": "HIGH"
            },
            "tools_audit": {
                 "original": "string",
                 "suggestion": "string",
                 "reason": "string",
                 "priority": "MEDIUM"
            },
            "frameworks_audit": {
                 "original": "string",
                 "suggestion": "string",
                 "reason": "string",
                 "priority": "HIGH"
            }
        }
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    // 🧹 SANITIZATION
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    return JSON.parse(text);

  } catch (error) {
    console.error("Audit AI Error:", error);
    // Return safe fallback
    return { 
        error: "Failed to audit resume.", 
        details: error.message,
        missingKeywords: [],
        experience: [],
        projects: [],
        skills: {},
        education: []
    }; 
  }
};

/**
 * Generates a tailored Cover Letter based on Resume + JD.
 */
export const generateCoverLetter = async (resumeData, jobDescription) => {
  try {
    // 1. Context Preparation
    const context = {
        name: resumeData.personalInfo?.name || resumeData.NAME || "Candidate",
        email: resumeData.personalInfo?.email || resumeData.EMAIL,
        phone: resumeData.personalInfo?.phone || resumeData.PHONE,
        skills: resumeData.skills || resumeData.SKILLS,
        experience: (resumeData.experience || resumeData.EXPERIENCE || []).slice(0, 3) // Top 3 jobs
    };

    const prompt = `
      You are a professional Career Coach and Copywriter.
      
      TASK:
      Write a compelling, professional Cover Letter for ${context.name}.
      
      TARGET JOB DESCRIPTION:
      ${jobDescription}

      CANDIDATE BACKGROUND:
      ${JSON.stringify(context)}

      WRITING RULES:
      1. **Tone**: Professional, confident, but not arrogant.
      2. **Structure**: 
         - Standard Header (Name, Contact).
         - Hook: Why I am excited about this specific role (reference the JD).
         - Body: Connect specific skills/experience from my background to the JD requirements.
         - Closing: Call to action (interview request).
      3. **Length**: Concise (300-400 words).
      4. **Formatting**: Return clear Markdown text. Do NOT wrap in JSON code blocks. Just the text.

      Write the letter now.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();

  } catch (error) {
    console.error("Cover Letter AI Error:", error);
    throw new Error("Failed to generate cover letter.");
  }
};