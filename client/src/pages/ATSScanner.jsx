import React, { useState } from 'react';
import { atsAPI } from '../lib/api';
import { Button } from '../components/ui/Button';
import { TextArea } from '../components/ui/TextArea';
import { UploadCloud, CheckCircle, AlertCircle, FileText, X } from 'lucide-react';

const ATSScanner = () => {
  const [file, setFile] = useState(null);
  const [jd, setJd] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && selected.type === 'application/pdf') {
      setFile(selected);
      setError('');
    } else {
      setError('Please upload a valid PDF file.');
    }
  };

  const handleScan = async () => {
    if (!file || !jd) {
      setError("Please upload a resume and paste a job description.");
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('jd', jd);

      const res = await atsAPI.analyze(formData);
      setResult(res.data); // Expecting: { ats_score, summary, strengths, improvements }
    } catch (err) {
      setError("Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
            <h1 className="text-4xl font-bold font-display text-gray-900 mb-4">
                Check Your <span className="text-[#00c29f]">ATS Score</span>
            </h1>
            <p className="text-gray-500 max-w-2xl mx-auto">
                Upload your resume and the job description you're applying for. Our AI will analyze the match and give you a score.
            </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            
            {/* Left: Input Section */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
                
                {/* File Upload Area */}
                <div className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors ${file ? 'border-[#00c29f] bg-[#00c29f]/5' : 'border-gray-200 hover:border-[#00c29f]/50'}`}>
                    <input 
                        type="file" 
                        id="resume-upload" 
                        className="hidden" 
                        accept=".pdf"
                        onChange={handleFileChange}
                    />
                    
                    {!file ? (
                        <label htmlFor="resume-upload" className="cursor-pointer flex flex-col items-center">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-500">
                                <UploadCloud size={24} />
                            </div>
                            <span className="font-bold text-gray-900">Click to upload Resume</span>
                            <span className="text-sm text-gray-400 mt-1">PDF only (Max 5MB)</span>
                        </label>
                    ) : (
                        <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="w-10 h-10 bg-red-50 text-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <FileText size={20}/>
                                </div>
                                <span className="truncate text-sm font-medium text-gray-700">{file.name}</span>
                            </div>
                            <button onClick={() => setFile(null)} className="text-gray-400 hover:text-red-500">
                                <X size={20} />
                            </button>
                        </div>
                    )}
                </div>

                {/* JD Input */}
                <TextArea 
                    label="Job Description" 
                    placeholder="Paste the full job description here..." 
                    value={jd}
                    onChange={(e) => setJd(e.target.value)}
                    className="h-48"
                />

                {error && (
                    <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 p-3 rounded-lg">
                        <AlertCircle size={16} /> {error}
                    </div>
                )}

                <Button onClick={handleScan} loading={loading} className="w-full h-12 text-lg">
                    Analyze Match
                </Button>
            </div>

            {/* Right: Results Section */}
            {result ? (
                <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 animate-fade-in-up">
                    <div className="flex flex-col items-center mb-8">
                        {/* Gauge Visual */}
                        <div className="relative w-40 h-40 flex items-center justify-center mb-4">
                             <svg className="w-full h-full transform -rotate-90">
                                <circle cx="80" cy="80" r="70" stroke="#f3f4f6" strokeWidth="12" fill="none" />
                                <circle 
                                    cx="80" cy="80" r="70" stroke="#00c29f" strokeWidth="12" fill="none" 
                                    strokeDasharray={440}
                                    strokeDashoffset={440 - (440 * result.ats_score) / 100}
                                    className="transition-all duration-1000 ease-out"
                                />
                             </svg>
                             <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-900">
                                 <span className="text-4xl font-bold">{result.ats_score}%</span>
                                 <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Match</span>
                             </div>
                        </div>
                        <p className="text-center text-gray-600 italic">"{result.summary}"</p>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                <CheckCircle size={18} className="text-green-500"/> Strengths
                            </h3>
                            <ul className="space-y-2">
                                {result.strengths.map((str, i) => (
                                    <li key={i} className="text-sm text-gray-600 bg-green-50 px-3 py-2 rounded-lg border border-green-100">
                                        {str}
                                    </li>
                                ))}
                            </ul>
                        </div>

                         <div>
                            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                <AlertCircle size={18} className="text-orange-500"/> Improvements
                            </h3>
                            <ul className="space-y-2">
                                {result.improvements.map((imp, i) => (
                                    <li key={i} className="text-sm text-gray-600 bg-orange-50 px-3 py-2 rounded-lg border border-orange-100">
                                        {imp}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            ) : (
                // Placeholder State
                <div className="h-full bg-gray-100/50 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 p-8 min-h-[400px]">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                        <FileText size={32} className="opacity-20"/>
                    </div>
                    <p className="font-medium">Analysis results will appear here</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ATSScanner;