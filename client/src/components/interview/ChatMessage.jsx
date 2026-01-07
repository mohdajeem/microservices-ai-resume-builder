import React, { useState } from 'react';
import { User, Bot, Eye, EyeOff, AlertCircle } from 'lucide-react';

const ChatMessage = ({ message }) => {
  const isAi = message.role === 'ai';
  const [showFeedback, setShowFeedback] = useState(false);

  return (
    <div className={`flex gap-4 ${isAi ? 'flex-row' : 'flex-row-reverse'} animate-fade-in-up`}>
      {/* Avatar */}
      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isAi ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-200 text-gray-600'}`}>
        {isAi ? <Bot size={20} /> : <User size={20} />}
      </div>

      <div className={`flex flex-col max-w-[80%] ${isAi ? 'items-start' : 'items-end'}`}>
        {/* Message Bubble */}
        <div className={`px-5 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
          isAi 
            ? 'bg-white border border-gray-200 text-gray-800 rounded-tl-none' 
            : 'bg-[#00c29f] text-white rounded-tr-none'
        }`}>
          {message.content}
        </div>

        {/* Feedback Section (Only for AI messages) */}
        {isAi && message.feedback && (
          <div className="mt-2">
            <button 
              onClick={() => setShowFeedback(!showFeedback)}
              className="text-xs font-medium text-indigo-600 flex items-center gap-1 hover:underline"
            >
              {showFeedback ? <EyeOff size={12} /> : <Eye size={12} />}
              {showFeedback ? 'Hide Critique' : 'View Critique'}
            </button>

            {showFeedback && (
              <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800 animate-in slide-in-from-top-2">
                <div className="flex items-center gap-2 font-bold mb-1">
                  <AlertCircle size={12} />
                  <span>Feedback (Score: {message.feedback.score}/10)</span>
                </div>
                <p>{message.feedback.critique}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;