import { aiClient } from "./aiClient.js";

/**
 * 2. Start Interview (Question 1)
 */
export const startInterview = async (resumeContent, techStack) => {
  // Ensure resumeContent is a string
  const resumeString = typeof resumeContent === 'string' ? resumeContent : JSON.stringify(resumeContent);
  
  const result = await aiClient.generate("INTERVIEW_START", {
    resumeText: resumeString,
    techStack: techStack
  });

  // Since INTERVIEW_START template returns raw text (not JSON)
  // we check if it's already a string or inside the data property
  return result?.text || result;
};

/**
 * 3. Process Turn (User Answer -> AI Feedback -> Next Question)
 */
export const processTurn = async (history, userAnswer, techStack) => {
  // We use the AI Orchestrator for the generation
  const result = await aiClient.generate("INTERVIEW_TURN", {
    userAnswer,
    techStack
  });

  return result;
};