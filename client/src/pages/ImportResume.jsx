import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { atsAPI } from '../lib/api';
import { Button } from '../components/ui/Button';
import { UploadCloud, FileText, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

const ImportResume = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
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

  const normalizeDataForWizard = (data) => {
    // Map the Parser response (lowercase) to the Wizard State (Uppercase)
    // and ensure arrays exist to prevent crashes
    return {
      NAME: data.personalInfo?.name || '',
      EMAIL: data.personalInfo?.email || '',
      PHONE: data.personalInfo?.phone || '',
      LOCATION: data.personalInfo?.location || '',
      LINKEDIN: data.personalInfo?.linkedin || '',
      GITHUB: data.personalInfo?.github || '',
      PORTFOLIO: data.personalInfo?.portfolio || '',
      
      EXPERIENCE: data.experience?.map(exp => ({
        COMPANY: exp.company || '',
        ROLE: exp.role || '',
        DURATION: exp.duration || '',
        LOCATION: exp.location || '',
        POINTS: exp.points?.length ? exp.points : ['']
      })) || [{ COMPANY: '', ROLE: '', DURATION: '', LOCATION: '', POINTS: [''] }],

      PROJECTS: data.projects?.map(proj => ({
        TITLE: proj.title || '',
        LINK: proj.link || '',
        TECH: proj.tech || '',
        DATE: proj.date || '',
        POINTS: proj.points?.length ? proj.points : ['']
      })) || [{ TITLE: '', LINK: '', TECH: '', DATE: '', POINTS: [''] }],

      EDUCATION: data.education?.map(edu => ({
        INSTITUTE: edu.institute || '',
        DURATION: edu.duration || '',
        DETAILS: edu.details || ''
      })) || [{ INSTITUTE: '', DURATION: '', DETAILS: '' }],

      SKILLS: {
        LANGUAGES: Array.isArray(data.skills?.languages) ? data.skills.languages.join(', ') : (data.skills?.languages || ''),
        FRAMEWORKS_LIBRARIES: Array.isArray(data.skills?.frameworks) ? data.skills.frameworks.join(', ') : (data.skills?.frameworks || ''),
        TOOLS: Array.isArray(data.skills?.tools) ? data.skills.tools.join(', ') : (data.skills?.tools || ''),
        DATABASES: Array.isArray(data.skills?.databases) ? data.skills.databases.join(', ') : (data.skills?.databases || ''),
      },
      // ADDED THESE TWO SECTIONS
      certifications: data.certifications || [], // Expecting array of strings
      achievements: data.achievements || []      // Expecting array of strings
    };
  };

  const handleParse = async () => {
    if (!file) return;
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('resume', file);
      const res = await atsAPI.parse(formData);
      
      if (res.data.success) {
        const wizardData = normalizeDataForWizard(res.data.data);
        // Navigate to Create Resume page with the data in state
        navigate('/create-profile', { state: { prefilledData: wizardData } });
      }
    } catch (err) {
      setError("Failed to parse resume. Please try entering data manually.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-xl w-full">
        <div className="text-center mb-10">
            <h1 className="text-3xl font-bold font-display text-gray-900 mb-2">Import Existing Resume</h1>
            <p className="text-gray-500">We'll extract your details so you don't have to start from scratch.</p>
        </div>

        <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100">
             <div className={`border-2 border-dashed rounded-2xl p-10 text-center transition-colors mb-6 ${file ? 'border-[#00c29f] bg-[#00c29f]/5' : 'border-gray-200 hover:border-[#00c29f]/50'}`}>
                <input 
                    type="file" 
                    id="import-upload" 
                    className="hidden" 
                    accept=".pdf"
                    onChange={handleFileChange}
                />
                
                {!file ? (
                    <label htmlFor="import-upload" className="cursor-pointer flex flex-col items-center">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 text-[#00c29f] shadow-sm">
                            <UploadCloud size={32} />
                        </div>
                        <span className="font-bold text-gray-900 text-lg">Upload PDF Resume</span>
                        <span className="text-sm text-gray-400 mt-2">Max 5MB</span>
                    </label>
                ) : (
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 text-[#00c29f] shadow-sm">
                            <FileText size={32} />
                        </div>
                        <span className="font-bold text-gray-900 text-lg mb-4">{file.name}</span>
                        <button onClick={() => setFile(null)} className="text-sm text-red-500 hover:underline">Remove file</button>
                    </div>
                )}
            </div>

            {error && (
                <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 p-3 rounded-lg mb-6">
                    <AlertCircle size={16} /> {error}
                </div>
            )}

            <div className="flex flex-col gap-3">
                <Button onClick={handleParse} loading={loading} disabled={!file} className="w-full py-4 text-lg">
                    {loading ? 'Analyzing...' : 'Import & Continue'} <ArrowRight className="ml-2" />
                </Button>
                
                <button 
                    onClick={() => navigate('/create-profile')} 
                    className="text-gray-500 text-sm hover:text-gray-900 font-medium py-2"
                >
                    Skip, I'll enter manually
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ImportResume;