import React, { createContext, useContext, useState, useCallback } from 'react';
import { interviewApi } from '../lib/interviewApi';
import { useToast } from './ToastContext'; // Assuming you have this from previous steps

const InterviewContext = createContext();

export const useInterview = () => useContext(InterviewContext);

export const InterviewProvider = ({ children }) => {
  const [status, setStatus] = useState('idle'); // 'idle' | 'setup' | 'active' | 'completed'
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionData, setSessionData] = useState(null); // Stores difficulty, role, etc.
  const toast = useToast();

  const startInterview = async (resumeId, techStack, difficulty) => {
    setStatus('loading');
    try {
      const res = await interviewApi.startSession({ resumeId, techStack, difficulty });
      
      setSessionId(res.data.sessionId);
      setSessionData({ techStack, difficulty });
      
      // Add the AI's greeting to the chat
      setMessages([{
        id: Date.now(),
        role: 'ai',
        content: res.data.message,
        feedback: null
      }]);
      
      setStatus('active');
    } catch (error) {
      console.error("Failed to start interview", error);
      toast?.error("Could not start session. Please try again.");
      setStatus('setup'); // Go back to setup
    }
  };

  const sendUserReply = async (text) => {
    if (!text.trim()) return;

    // 1. Add User Message immediately (Optimistic UI)
    const userMsg = { id: Date.now(), role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      // 2. Call API
      const res = await interviewApi.sendMessage({ 
        sessionId, 
        answer: text 
      });

      // 3. Add AI Response
      const aiMsg = {
        id: Date.now() + 1,
        role: 'ai',
        content: res.data.message,
        feedback: res.data.feedback || null // { score, critique }
      };

      setMessages(prev => [...prev, aiMsg]);

      // 4. Check completion
      if (res.data.isCompleted) {
        setStatus('completed');
      }

    } catch (error) {
      console.error("Chat error", error);
      toast?.error("Failed to send message.");
    } finally {
      setIsTyping(false);
    }
  };

  const resetSession = () => {
    setStatus('idle');
    setSessionId(null);
    setMessages([]);
    setSessionData(null);
  };

  const value = {
    status,
    setStatus,
    messages,
    isTyping,
    startInterview,
    sendUserReply,
    resetSession,
    sessionData
  };

  return (
    <InterviewContext.Provider value={value}>
      {children}
    </InterviewContext.Provider>
  );
};