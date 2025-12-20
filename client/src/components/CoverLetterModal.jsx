import React, { useState } from 'react';
import { resumeAPI } from '../lib/api';
import { Button } from './ui/Button'; // Assuming you have this from previous steps
import { TextArea } from './ui/TextArea'; // Assuming you have this
import { X, Sparkles, Copy, Download, RefreshCw, FileText, Check } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const CoverLetterModal = ({ resumeData, onClose }) => {
  const toast = useToast();
  const [step, setStep] = useState('input'); // 'input' | 'loading' | 'result'
  const [jobDescription, setJobDescription] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!jobDescription.trim()) {
      toast.error("Please paste a Job Description first.");
      return;
    }
    
    setStep('loading');
    try {
      const res = await resumeAPI.generateCoverLetter({
        resumeData: resumeData,
        jobDescription: jobDescription
      });

      if (res.data.success) {
        setCoverLetter(res.data.coverLetter);
        setStep('result');
        toast.success("Cover letter generated successfully.");
      }
    } catch (error) {
      toast.error("Failed to generate cover letter. Please try again.");
      setStep('input');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(coverLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([coverLetter], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = "Cover_Letter.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[85vh] overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
            <FileText className="text-[#00c29f]" /> Cover Letter Generator
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
          
          {/* STEP 1: INPUT */}
          {step === 'input' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
                <p className="text-sm text-blue-700 leading-relaxed">
                  Paste the <strong>Job Description</strong> below. Our AI will analyze your resume against the JD to write a personalized, persuasive cover letter.
                </p>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Job Description</label>
                <TextArea 
                  placeholder="Paste the job description here..." 
                  className="h-64 font-mono text-sm"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* STEP 2: LOADING */}
          {step === 'loading' && (
            <div className="h-64 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-gray-100 border-t-[#00c29f] rounded-full animate-spin"></div>
                <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#00c29f]" size={24} />
              </div>
              <h4 className="text-xl font-bold text-gray-900">Writing your story...</h4>
              <p className="text-gray-500 max-w-xs">AI is connecting your achievements to the job requirements.</p>
            </div>
          )}

          {/* STEP 3: RESULT */}
          {step === 'result' && (
            <div className="space-y-4 h-full flex flex-col">
              <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-6 overflow-y-auto shadow-inner">
                <pre className="whitespace-pre-wrap font-serif text-gray-800 text-sm leading-relaxed">
                  {coverLetter}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          {step === 'input' && (
            <Button onClick={handleGenerate} className="bg-[#00c29f] hover:bg-[#00a082] text-white shadow-lg shadow-teal-500/20">
              <Sparkles size={16} className="mr-2" /> Generate Letter
            </Button>
          )}

          {step === 'result' && (
            <>
              <Button variant="outline" onClick={() => setStep('input')}>
                <RefreshCw size={16} className="mr-2" /> New
              </Button>
              <Button variant="outline" onClick={handleDownload}>
                <Download size={16} className="mr-2" /> Save .txt
              </Button>
              <Button onClick={handleCopy} className="bg-gray-900 hover:bg-black text-white">
                {copied ? <Check size={16} className="mr-2" /> : <Copy size={16} className="mr-2" />}
                {copied ? "Copied!" : "Copy Text"}
              </Button>
            </>
          )}
        </div>

      </div>
    </div>
  );
};

export default CoverLetterModal;