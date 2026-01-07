import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

/**
 * 1. Generate the System Context
 */
const createSystemContext = (resumeText, techStack) => {
  // Ensure resumeText is a string
  const resumeString = typeof resumeText === 'string' ? resumeText : JSON.stringify(resumeText);
  
  return `
    You are a Senior Technical Interviewer at a top Tech Company (like Google/Amazon).
    You are interviewing a candidate for a ${techStack} role.
    
    CANDIDATE CONTEXT:
    ${resumeString.substring(0, 5000)}

    RULES:
    1. Ask ONE question at a time.
    2. Focus on Technical logic, Coding patterns, and System Design.
    3. If the user writes code, review it for bugs and efficiency.
    4. Be professional but demanding.
  `;
};

/**
 * 2. Start Interview (Question 1)
 */
export const startInterview = async (resumeContent, techStack) => {
  const context = createSystemContext(resumeContent, techStack);
  const prompt = `
    ${context}
    
    TASK: Start the interview. Introduce yourself briefly (1 sentence) and ask the first technical question based on the candidate's projects or skills.
  `;
  
  const result = await model.generateContent(prompt);
  return result.response.text();
};

/**
 * 3. Process Turn (User Answer -> AI Feedback -> Next Question)
 */
export const processTurn = async (history, userAnswer, techStack) => {
  
  // 1. Convert DB Transcript to Gemini Chat History
  let chatHistory = history.map(msg => ({
    role: msg.role === 'ai' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));

  // 🚨 CRITICAL FIX: Gemini requires history to start with 'user'.
  // Since our DB starts with AI (Question 1), we prepend a dummy user start message.
  if (chatHistory.length > 0 && chatHistory[0].role === 'model') {
    chatHistory.unshift({
      role: 'user',
      parts: [{ text: "Hello, I am ready for the interview. Please review my resume and ask the first question." }]
    });
  }

  const prompt = `
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
  `;

  // We start the chat with the corrected history
  const chat = model.startChat({ 
    history: chatHistory,
    generationConfig: { responseMimeType: "application/json" }
  });

  const result = await chat.sendMessage(prompt);
  const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
  
  return JSON.parse(text);
};