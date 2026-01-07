import React from 'react';
import { useInterview } from '../../context/InterviewContext';
import { Button } from '../ui/Button';
import { Trophy, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const InterviewResult = () => {
  const { messages, resetSession } = useInterview();
  const navigate = useNavigate();

  // Calculate generic score based on message feedback
  const feedbackMessages = messages.filter(m => m.feedback);
  const totalScore = feedbackMessages.reduce((acc, curr) => acc + (curr.feedback?.score || 0), 0);
  const averageScore = feedbackMessages.length ? Math.round(totalScore / feedbackMessages.length) : 0;

  const handleDashboard = () => {
    resetSession();
    navigate('/dashboard');
  };

  return (
    <div className="max-w-2xl mx-auto text-center pt-10">
      <div className="bg-white rounded-3xl p-10 shadow-2xl border border-gray-100">
        <div className="w-24 h-24 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Trophy size={48} />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Interview Completed!</h1>
        <p className="text-gray-500 mb-8">Here is how you performed in this session.</p>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div className="text-xs text-gray-400 uppercase font-bold tracking-wider">Questions</div>
            <div className="text-2xl font-bold text-gray-800">{Math.ceil(messages.length / 2)}</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div className="text-xs text-gray-400 uppercase font-bold tracking-wider">Avg Score</div>
            <div className="text-2xl font-bold text-indigo-600">{averageScore}/10</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div className="text-xs text-gray-400 uppercase font-bold tracking-wider">Duration</div>
            <div className="text-2xl font-bold text-gray-800">15m</div>
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          <Button variant="outline" onClick={resetSession}>
            Start New Session
          </Button>
          <Button onClick={handleDashboard}>
            <Home size={18} className="mr-2" /> Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InterviewResult;