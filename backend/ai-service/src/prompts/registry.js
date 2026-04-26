export const PROMPTS = {
  ATS_SCAN: {
    provider: 'groq',
    template: (resumeText, jobDescription) => `
    You are an elite, high-precision ATS Scanning Algorithm used by Fortune 500 companies.
    Your task is to perform a detailed and intelligent analysis of a resume against a specific Job Description (JD).
    
    ---------------------------------------------------------
    1. TARGET JOB DESCRIPTION (JD):
    ${jobDescription}
    ---------------------------------------------------------
    
    2. CANDIDATE RESUME TEXT:
    ${resumeText}
    ---------------------------------------------------------
    
    SCORING PROTOCOL:
    1. **Semantic Selection**: A requirement is MET if the candidate lists a specific technology that belongs to that category. 
       - EXECUTION: "MongoDB" satisfies "NoSQL databases", "Redis" satisfies "Caching technologies", "Gemini/OpenAI" satisfies "AI tools".
    2. **Impact Evaluation**: Look for quantitative metrics ("Increased X by 20%").
    3. **Experience Gap**: Compare years of experience and domain depth.

    INSTRUCTIONS:
    - Keywords Found: List specific technologies from the resume that satisfy JD requirements.
    - Keywords Missing: List ONLY items from the JD that have NO equivalent or specific mention in the resume.
    - Be fair: If the JD asks for "Databases (SQL/NoSQL)" and the resume has "PostgreSQL" and "MongoDB", both are FOUND.

    Strictly output VALID JSON (no markdown):
    {
      "ats_score": number (0-100),
      "summary": "1-2 sentence summary of the strategic alignment.",
      "strengths": ["Top 3 technical or leadership areas where the candidate excels"],
      "improvements": ["Top 3 HIGH-PRIORITY missing items to reach 100%"],
      "keywords_found": ["Specific technologies found"],
      "keywords_missing": ["Specific required technologies NOT found"],
      "match_gap": {
        "skills": number,
        "experience": number,
        "education": number,
        "culture": number
      }
    }
  `},

  TAILORED_SUMMARY: {
    provider: 'groq',
    template: (resumeText, jobDescription) => `
    Role: Expert Resume Writer.
    Task: Write a high-impact Professional Summary (3-4 sentences) that tailors the candidate's existing experience to the provided Job Description.
    
    JOB DESCRIPTION:
    ${jobDescription}
    
    RESUME TEXT:
    ${resumeText}
    
    Instructions:
    1. Use the candidate's actual achievements from the Resume.
    2. Incorporate the most important keywords from the Job Description.
    3. Maintain a professional, results-oriented tone.
    
    Return ONLY the summary text. No preamble.
  `},

  REWRITE_COMPACT: {
    provider: 'groq',
    schema: true,
    template: (resume) => `
    You are an expert Resume Optimizer specialized in "One-Page Compaction".
    Your goal is to aggressively rewrite and prune a candidate's Experience and Projects to fit a strict one-page limit while maintaining maximum impact.

    --- SPECIAL PROJECT: Nexus Job ---
    If the project "Nexus Job" is mentioned, ensure it highlights these specific technical milestones:
    1. Distributed Microservices Architecture (Node.js, React, Gateway) with high availability.
    2. Real-time Semantic Analysis Engine using Google Gemini for automated content auditing and keyword optimization.
    3. High-fidelity LaTeX rendering pipeline utilizing Node.js Worker Threads for non-blocking PDF generation.
    4. One-Way AI Compaction logic for aggressive vertical space optimization.

    --- CORE RULES ---
    1. **ONE LINE ONLY**: Rewrite every single bullet point to be exactly 1 line long. Absolutely NO multi-line bullets. Remove all filler words, fluff, and unnecessary context.
    2. **AGGRESSIVE PRUNING**: 
       - Experience: Keep ONLY the top 3 most impactful bullets for each role. Delete the rest.
       - Projects: Keep ONLY the top 2 most impactful bullets for each project. Delete the rest.
    3. **PRESERVE IMPACT**: Use incredibly strong action verbs (e.g., "Spearheaded", "Architected", "Optimized") and keep ALL quantitative metrics (%, $, numbers, time-saved).
    4. **SCOPE**: Rewrite ONLY the 'points' arrays for 'experience' and 'projects'. Do NOT change company names, roles, titles, dates, or skills.
    5. **ONE-WAY TRANSFORMATION**: Treat this as a final, high-density version for immediate submission.

    --- INPUT DATA ---
    ${JSON.stringify(resume, null, 2)}

    --- OUTPUT INSTRUCTIONS ---
    1. Return ONLY a valid JSON object matching the input structure.
    2. Ensure the JSON is perfectly formatted without any markdown or conversational text.

    Expected JSON Structure:
    {
      "experience": [ { "company": "...", "role": "...", "points": ["Condensed high-impact point 1", "Condensed high-impact point 2", "Condensed high-impact point 3"] }, ... ],
      "projects": [ { "title": "...", "points": ["Condensed high-impact point 1", "Condensed high-impact point 2"] }, ... ]
    }
  `},

  RESUME_PARSE: {
    provider: 'groq',
    // provider: 'gemini',
    template: (rawText, linksContext) => `
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
           "points": ["string"] 
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
      "highlights": [ 
         { "name": "string", "link": "string (URL if found, else empty)" } 
      ]
    }

    Return ONLY raw JSON. No Markdown formatting. No \`\`\`json blocks.
  `},

  SMART_SKILLS: {
    provider: 'groq',
    template: (resumeSkills, jobDescription) => `
    You are an ATS Selection Algorithm. 
    Analyze the current Resume Skills and the target Job Description.
    Identify missing high-priority keywords (Hard Skills, Tools, Frameworks).
    Categorize them into 'Primary' (Mandatory in JD) and 'Secondary' (Good to have).
    
    Current Resume Skills:
    ${JSON.stringify(resumeSkills)}
    
    Target Job Description:
    ${jobDescription}
    
    Return a JSON object with:
    {
      "missing_skills": [
        { "name": "string", "category": "primary|secondary", "reason": "short explanation" }
      ],
      "top_keywords": ["string"] // Important JD keywords not in resume
    }
    
    Return ONLY raw JSON. No Markdown.
    `
  },

  RESUME_AUDIT: {
    provider: 'groq',
    template: (resumeData, jobDescription, atsImprovements = [], compactMode = false) => {
    const fullContextData = {
        personalInfo: resumeData.personalInfo || resumeData.PERSONALINFO,
        experience: resumeData.experience || resumeData.EXPERIENCE,
        projects: resumeData.projects || resumeData.PROJECTS,
        skills: resumeData.skills || resumeData.SKILLS,
        education: resumeData.education || resumeData.EDUCATION,
    };

    return `
      You are an UNCOMPROMISING Resume Auditor and Fortune 500 Career Strategist. Your mission: TRANSFORM THIS RESUME FROM A "GENERALIST" INTO A "PERFECT FIT" FOR THIS SPECIFIC JOB.

      ---------------------------------------------------------
      CRITICAL TARGET (JOB DESCRIPTION):
      ${jobDescription}
      ---------------------------------------------------------

      COMPACT MODE STATUS: ${compactMode ? "ACTIVE (FORCE REFINEMENT)" : "INACTIVE"}
      ${compactMode ? "**IMPORTANT**: User wants a ONE-PAGE resume. You MUST provide extremely concise, high-impact bullet points. Remove all fluff. Prioritize quality over quantity." : ""}
      
      PREVIOUS ATS FEEDBACK (THESE ARE HARD GAPS; YOU MUST FIX EVERY ONE):
      ${atsImprovements.length > 0 ? atsImprovements.map(issue => `- [CRITICAL FIX] ${issue}`).join('\n') : "No previous feedback - focus on Hard Key-Skill Injection."}

      ---------------------------------------------------------
      CURRENT RESUME DATA:
      ${JSON.stringify(fullContextData)}
      ---------------------------------------------------------

      STRATEGIC "BRUTAL AUDITOR" INSTRUCTIONS:
      1.  **Hard Keyword Injection (HIGHEST PRIORITY)**: 
          - Scan the JD for every Technical Skill, Tool, and Methodology (e.g., "Kubernetes", "Redis", "Agile").
          - If a word exists in the JD but NOT in the resume, you MUST rewrite an existing bullet point to specifically mention it in a high-impact way.
          - Use the "Additional Skills" field in the 'skills' object to inject any "leftover" JD keywords that don't fit Languages/Tools.
      
      2.  **The "Deductive Audit" mindset**: 
          - If the JD asks for "Scalability" and the resume just says "Built a website," you have FAILED. 
          - Rewrite it: "Architected a scalable, event-driven microservices architecture using Node.js and Redis, reducing latency by 40%."
      
      3.  **Layout Maintenance (FORCE ONE PAGE)**:
          - If you suggest adding a Summary (+ ATS Score), you MUST identify "Fluff" or "Low-Impact" bullets in the EXPERIENCE or PROJECTS sections that can be DELETED or MERGED to save space.
          - Record these in the 'lineTrade' object.
      
      4.  **Quantification or Failure**: Vague statements are ATS-Invisible. Every single bullet point must have a number (%, $, #, hours, users). 
          - Bad: "Helped team with deployment."
          - FIX: "Automated deployment pipelines using GitHub Actions, reducing deployment time by 2.5 hours per week for a team of 10."

      OUTPUT FORMAT (STRICT JSON - NO MARKDOWN):
      {
        "missingKeywordsFixed": ["List of every JD keyword you successfully injected"],
        "lineTrade": {
            "summaryImpact": "High (+15 ATS points)",
            "spaceSavingSuggestions": [
                { "original": "Exact text to remove", "replacement": "New merged bullet (or empty if deletion)", "reason": "Low-impact fluff; deleting saves 2 lines of vertical space." }
            ]
        },
        "summary": { 
            "original": "Current summary", 
            "suggestion": "A high-impact summary that uses at least 5 different JD keywords.", 
            "reason": "Explain how this summary signals a 95% match." 
        },
        "skills": [
            {
               "fieldName": "languages|frameworks|tools|databases|core_concepts|soft_skills|additional_skills",
               "original": "Current text",
               "suggestion": "Updated text adding missing JD keywords.",
               "reason": "Why these are mandatory."
            }
        ],
        "experience": [
            {
                "company": "Exact Company Name",
                "points_audit": [
                    {
                        "original": "Original bullet",
                        "suggestion": "Rewritten Power Statement with keywords and metrics.",
                        "reason": "Keyword match improved."
                    }
                ]
            }
        ],
        "projects": [
            {
                "title": "Exact Title",
                "points_audit": [
                    {
                        "original": "Original bullet",
                        "suggestion": "Enhanced description with tech stack mentioned in JD.",
                        "reason": "Technical relevance."
                    }
                ]
            }
        ]
      }
    `;
  }},

  INTERVIEW_START: {
    provider: 'gemini',
    template: (resumeText, techStack) => `
      You are a Senior Technical Interviewer at a top Tech Company (like Google/Amazon).
      You are interviewing a candidate for a ${techStack} role.
      
      CANDIDATE CONTEXT:
      ${resumeText.substring(0, 5000)}

      RULES:
      1. Ask ONE question at a time.
      2. Focus on Technical logic, Coding patterns, and System Design.
      3. If the user writes code, review it for bugs and efficiency.
      4. Be professional but demanding.
      
      TASK: Start the interview. Introduce yourself briefly (1 sentence) and ask the first technical question based on the candidate's projects or skills.
    `
  },

  INTERVIEW_TURN: {
    provider: 'gemini',
    template: (userAnswer, techStack) => `
      You are a Senior Technical Interviewer evaluating a candidate's response for a ${techStack} role.

      USER ANSWER: "${userAnswer}"

      TASK:
      1. Evaluate the answer. Is it correct? Is it optimized?
      2. Provide short, hidden feedback (CRITIQUE).
      3. Ask the NEXT follow-up question.
      
      OUTPUT FORMAT (Strict JSON):
      {
        "feedback": "Your internal critique of the answer (2-3 sentences)",
        "rating": 8, // 1-10 score
        "nextQuestion": "The text of the next question to ask the user"
      }
    `
  }
};