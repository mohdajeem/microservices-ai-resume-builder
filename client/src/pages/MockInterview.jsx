import React, { useEffect } from 'react';
import { InterviewProvider, useInterview } from '../context/InterviewContext';
import InterviewSetup from '../components/interview/InterviewSetup';
import InterviewRoom from '../components/interview/InterviewRoom';
import InterviewResult from '../components/interview/InterviewResult';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const InterviewContent = () => {
  const { status, setStatus } = useInterview();
  const navigate = useNavigate();

  // Handle back button behavior
  const handleBack = () => {
    if (status === 'active') {
      if (window.confirm("End interview? Progress will be lost.")) {
        setStatus('setup');
      }
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-6">
      {/* Header */}
      <div className="max-w-5xl mx-auto mb-6 flex items-center">
        <button onClick={handleBack} className="text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft size={24} />
        </button>
      </div>

      {/* Render based on Status */}
      <div className="animate-fade-in-up">
        {(status === 'idle' || status === 'setup' || status === 'loading') && <InterviewSetup />}
        {status === 'active' && <InterviewRoom />}
        {status === 'completed' && <InterviewResult />}
      </div>
    </div>
  );
};

// Wrap the page in the Provider
const MockInterview = () => {
  return (
    <InterviewProvider>
      <InterviewContent />
    </InterviewProvider>
  );
};

export default MockInterview;