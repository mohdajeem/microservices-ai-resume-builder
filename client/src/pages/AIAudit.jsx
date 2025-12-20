import React, { useState, useEffect } from 'react';
import { resumeAPI } from '../lib/api';
import { Button } from '../components/ui/Button';
import { TextArea } from '../components/ui/TextArea';
import { Wand2, AlertTriangle, ArrowRight, Loader2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const AIAudit = () => {
  const toast = useToast();
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [jd, setJd] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);

  useEffect(() => {
    // Fetch user's resumes to populate dropdown
    resumeAPI.list().then(res => {
        setResumes(res.data.data);
        if(res.data.data.length > 0) setSelectedResumeId(res.data.data[0]._id);
    });
  }, []);

  const handleAudit = async () => {
    if (!selectedResumeId || !jd) return;
    
    setLoading(true);
    try {
        // 1. Fetch full resume details first to get the content
        const detailRes = await resumeAPI.getDetail(selectedResumeId);
        const resumeContent = detailRes.data.data.content;

        // 2. Send content + JD to Audit API
        const auditRes = await resumeAPI.audit({
            resumeData: {
                SUMMARY: "Professional Summary...", // Assuming summary exists in your schema or derived
                EXPERIENCE: resumeContent.experience,
                PROJECTS: resumeContent.projects
            },
            jobDescription: jd
        });

        setReport(auditRes.data.report);
        toast.success("Resume audit completed.");
    } catch (error) {
        toast.error("Failed to audit resume.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        <div className="mb-8 border-b border-gray-100 pb-8">
             <h1 className="text-3xl font-bold font-display text-gray-900 flex items-center gap-3">
                <Wand2 className="text-[#00c29f]" size={32} /> AI Resume Auditor
            </h1>
            <p className="text-gray-500 mt-2">Get specific, actionable line-by-line feedback on your resume based on the job description.</p>
        </div>

        {!report ? (
             <div className="max-w-3xl mx-auto bg-gray-50 p-8 rounded-2xl border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Resume to Audit</label>
                <select 
                    className="w-full p-3 rounded-xl border border-gray-200 mb-6 bg-white outline-none focus:border-[#00c29f]"
                    value={selectedResumeId}
                    onChange={(e) => setSelectedResumeId(e.target.value)}
                >
                    {resumes.map(r => (
                        <option key={r._id} value={r._id}>{r.versionName} ({new Date(r.updatedAt).toLocaleDateString()})</option>
                    ))}
                </select>

                <TextArea 
                    label="Paste Job Description"
                    placeholder="Senior Software Engineer..."
                    value={jd}
                    onChange={(e) => setJd(e.target.value)}
                    className="h-64"
                />

                <Button onClick={handleAudit} loading={loading} className="w-full mt-4">
                    Generate Audit Report
                </Button>
             </div>
        ) : (
            <div className="animate-fade-in-up">
                 <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Audit Report</h2>
                    <Button variant="outline" onClick={() => setReport(null)} size="sm">Audit Another</Button>
                 </div>

                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Sidebar: Missing Keywords */}
                    <div className="lg:col-span-1">
                        <div className="bg-red-50 p-6 rounded-2xl border border-red-100 sticky top-24">
                            <h3 className="font-bold text-red-800 flex items-center gap-2 mb-4">
                                <AlertTriangle size={18}/> Missing Keywords
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {report.missingKeywords?.map((kw, i) => (
                                    <span key={i} className="bg-white text-red-600 px-3 py-1 rounded-full text-sm border border-red-100 font-medium">
                                        {kw}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Main Content: Suggestions */}
                    <div className="lg:col-span-2 space-y-6">
                        {report.experience?.map((exp, i) => (
                            <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <h3 className="font-bold text-lg mb-4 text-gray-800 border-b pb-2">{exp.company} - {exp.role}</h3>
                                <div className="space-y-6">
                                    {exp.points.map((point, j) => (
                                        <div key={j} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="p-4 bg-gray-50 rounded-xl text-sm text-gray-600">
                                                <div className="text-xs font-bold text-gray-400 uppercase mb-1">Original</div>
                                                {point.original}
                                            </div>
                                            <div className="p-4 bg-teal-50 rounded-xl text-sm text-gray-800 border border-teal-100 relative">
                                                <div className="text-xs font-bold text-teal-600 uppercase mb-1 flex justify-between">
                                                    Suggestion
                                                    <span className="bg-white px-2 py-0.5 rounded text-[10px] border border-teal-200">{point.type}</span>
                                                </div>
                                                {point.suggestion}
                                                <div className="mt-2 text-xs text-teal-600 italic border-t border-teal-100/50 pt-2">
                                                    Reason: {point.reason}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                 </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default AIAudit;