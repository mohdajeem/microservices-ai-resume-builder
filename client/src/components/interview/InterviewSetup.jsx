import React, { useState, useEffect } from 'react';
import { resumeAPI } from '../../lib/api'; // Existing API to fetch resumes
import { useInterview } from '../../context/InterviewContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Loader2, BrainCircuit } from 'lucide-react';

const InterviewSetup = () => {
  const { startInterview } = useInterview();
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [selectedResume, setSelectedResume] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    const fetchResumes = async () => {
      try {
        const res = await resumeAPI.list();
        setResumes(res.data.data || []);
        if (res.data.data.length > 0) setSelectedResume(res.data.data[0]._id);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchResumes();
  }, []);

  const handleStart = async () => {
    if (!selectedResume || !targetRole) return alert("Please fill all fields");
    setStarting(true);
    await startInterview(selectedResume, targetRole, difficulty);
    setStarting(false);
  };

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-[#00c29f]" /></div>;

  return (
    <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      <div className="bg-indigo-600 p-6 text-white text-center">
        <BrainCircuit size={48} className="mx-auto mb-3 opacity-90" />
        <h2 className="text-2xl font-bold">AI Mock Interview</h2>
        <p className="text-indigo-100 text-sm mt-2">Simulate a real technical interview tailored to your resume.</p>
      </div>

      <div className="p-8 space-y-6">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Select Resume Context</label>
          <select 
            className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#00c29f] focus:border-transparent outline-none bg-white"
            value={selectedResume}
            onChange={(e) => setSelectedResume(e.target.value)}
          >
            {resumes.map(res => (
              <option key={res._id} value={res._id}>
                {res.versionName || "Untitled Resume"} ({new Date(res.updatedAt).toLocaleDateString()})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Target Job Role</label>
          <Input 
            placeholder="e.g. Senior React Developer at Google" 
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Difficulty Level</label>
          <div className="flex gap-3">
            {['Easy', 'Medium', 'Hard'].map(level => (
              <button
                key={level}
                onClick={() => setDifficulty(level)}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                  difficulty === level 
                    ? 'bg-indigo-600 text-white shadow-md transform scale-105' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        <Button onClick={handleStart} loading={starting} className="w-full h-12 text-lg">
          Start Session
        </Button>
      </div>
    </div>
  );
};

export default InterviewSetup;