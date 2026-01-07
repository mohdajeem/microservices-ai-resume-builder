import React, { useState, useRef, useEffect } from 'react';
import { useInterview } from '../../context/InterviewContext';
import ChatMessage from './ChatMessage';
import { Send, Loader2, StopCircle } from 'lucide-react';

const InterviewRoom = () => {
  const { messages, isTyping, sendUserReply, setStatus } = useInterview();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendUserReply(input);
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] bg-gray-50 max-w-5xl mx-auto rounded-2xl shadow-xl overflow-hidden border border-gray-200">
      
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          <span className="font-bold text-gray-800">Live Interview Session</span>
        </div>
        <button 
          onClick={() => setStatus('completed')} 
          className="text-xs text-red-500 hover:text-red-700 font-bold flex items-center gap-1"
        >
          <StopCircle size={14} /> End Session
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        
        {isTyping && (
          <div className="flex gap-4 animate-fade-in">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
              <Loader2 size={20} className="animate-spin" />
            </div>
            <div className="bg-white border border-gray-200 px-5 py-3 rounded-2xl rounded-tl-none text-gray-500 text-sm italic">
              AI is analyzing your response...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white p-4 border-t border-gray-200">
        <div className="relative max-w-4xl mx-auto">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your answer here..."
            className="w-full pl-4 pr-14 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00c29f] focus:border-transparent outline-none resize-none text-sm custom-scrollbar"
            rows={2}
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="absolute right-3 bottom-3 p-2 bg-[#00c29f] hover:bg-[#00a085] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={18} />
          </button>
        </div>
        <div className="text-center mt-2 text-xs text-gray-400">
          Press Enter to send, Shift + Enter for new line
        </div>
      </div>
    </div>
  );
};

export default InterviewRoom;