import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { resumeAPI, atsAPI, compilerAPI } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { TextArea } from '../components/ui/TextArea';
import FixListPanel from '../components/FixListPanel'; 
import CoverLetterModal from '../components/CoverLetterModal';
import { 
    Loader2, Download, Save, ArrowLeft, Target, X, 
    Trash2, ChevronDown, ChevronUp, Edit3, Wand2, Plus, Link as LinkIcon, FileText
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

const ResumeEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  
  // --- STATE ---
  const [resumeData, setResumeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [compiling, setCompiling] = useState(false);
  const [activeSection, setActiveSection] = useState('personal'); 
  const [activeTab, setActiveTab] = useState('manual'); 

  // for cover letter
  const [showCoverLetter, setShowCoverLetter] = useState(false);

  const [pdfUrl, setPdfUrl] = useState(null);
  const [showAtsModal, setShowAtsModal] = useState(false);
  const [atsJd, setAtsJd] = useState('');
  const [atsResult, setAtsResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  
  // Audit State
  const [auditResults, setAuditResults] = useState([]); 
  const [isAuditing, setIsAuditing] = useState(false);

  // Highlight State
  const [highlightId, setHighlightId] = useState(null);

  // --- EFFECTS ---
  useEffect(() => {
    fetchResumeAndPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    return () => { if (pdfUrl) URL.revokeObjectURL(pdfUrl); };
  }, [pdfUrl]);

  // --- API ACTIONS ---
  const fetchResumeAndPreview = async () => {
    try {
      const res = await resumeAPI.getDetail(id);
      let data = res.data.data;
      
      // Normalize simple lists to objects if necessary
      const normalizeList = (list) => {
          if (!Array.isArray(list)) return [];
          return list.map(item => {
              if (typeof item === 'string') return { name: item, link: '' };
              return item;
          });
      };

      if (!data.content.certifications) data.content.certifications = [];
      else data.content.certifications = normalizeList(data.content.certifications);

      if (!data.content.achievements) data.content.achievements = [];
      else data.content.achievements = normalizeList(data.content.achievements);
      
      setResumeData(data);
      if (data.latexCode) updatePdfPreview(data.latexCode);
    } catch (error) {
      // Failed to load resume
    } finally {
      setLoading(false);
    }
  };

  const updatePdfPreview = async (latexCode) => {
    if (!latexCode) return;
    setCompiling(true);
    try {
        const response = await compilerAPI.compile(latexCode);
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        if (pdfUrl) URL.revokeObjectURL(pdfUrl);
        setPdfUrl(url);
    } catch (error) {
        console.error("Preview generation failed", error);
    } finally {
        setCompiling(false);
    }
  };

  const handleSave = async (newData = resumeData) => {
    setSaving(true);
    try {
      const res = await resumeAPI.update(id, { updatedContent: newData.content });
      setResumeData(prev => ({ ...prev, ...res.data })); 
      if (res.data.latexCode) await updatePdfPreview(res.data.latexCode);
    } catch (error) {
      alert("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  // --- HELPERS ---
  const updateContent = (callback) => {
      const newData = JSON.parse(JSON.stringify(resumeData));
      callback(newData.content);
      setResumeData(newData);
  };

  const handlePersonalInfoChange = (field, value) => updateContent((content) => { content.personalInfo[field] = value; });
  const handleSkillChange = (field, value) => updateContent((content) => { content.skills[field] = value; });
  
  const handleArrayChange = (section, index, field, value) => {
      updateContent((content) => { 
          if (!content[section]) content[section] = [];
          content[section][index][field] = value; 
      });
  };
  const handlePointChange = (section, itemIndex, pointIndex, value) => updateContent((content) => { content[section][itemIndex].points[pointIndex] = value; });
  const addArrayItem = (section, template) => updateContent((content) => { 
      if (!content[section]) content[section] = [];
      content[section].push(template); 
  });
  const removeArrayItem = (section, index) => updateContent((content) => { 
      if (content[section]) content[section].splice(index, 1); 
  });
  const addPoint = (section, itemIndex) => updateContent((content) => { content[section][itemIndex].points.push(''); });
  const removePoint = (section, itemIndex, pointIndex) => updateContent((content) => { content[section][itemIndex].points.splice(pointIndex, 1); });
  
  const handleSimpleArrayChange = (section, index, field, value) => {
      updateContent((content) => { 
          if (!content[section]) content[section] = [];
          content[section][index][field] = value; 
      });
  };
  const addSimpleListItem = (section) => {
      updateContent((content) => { 
          if (!content[section]) content[section] = [];
          content[section].push({ name: '', link: '' }); 
      });
  };
  const removeSimpleListItem = (section, index) => {
      updateContent((content) => { 
          if (content[section]) content[section] = [];
          content[section].splice(index, 1); 
      });
  };

  // --- ATS & FIX LOGIC ---
  const runAtsCheck = async () => {
    if (!atsJd) return;
    setAnalyzing(true);
    try {
        const pdfResponse = await fetch(pdfUrl);
        const pdfBlob = await pdfResponse.blob();
        const formData = new FormData();
        formData.append('resume', new File([pdfBlob], "resume.pdf", { type: "application/pdf" }));
        formData.append('jd', atsJd);
        
        const res = await atsAPI.analyze(formData);
        const result = res.data;
        setAtsResult(result);

        // Update Backend with ATS Score
        await resumeAPI.update(id, {
            atsScore: result.ats_score,
            jobDescription: atsJd,
            atsAnalysis: {
                strengths: result.strengths || [],
                improvements: result.improvements || [],
                summary: result.summary || ""
            }
        });
        toast.success("ATS analysis completed.");
    } catch (error) {
        toast.error("ATS Analysis failed.");
    } finally {
        setAnalyzing(false);
    }
  };

  const enableFixMode = async () => {
    if (!atsJd) {
        toast.error("We need the Job Description to perform a fix.");
        return;
    }

    setShowAtsModal(false);
    setActiveTab('fix');
    setIsAuditing(true);

    try {
        const payload = {
            resumeData: resumeData.content,
            jobDescription: atsJd,
            atsImprovements: atsResult?.improvements || [] 
        };

        const res = await resumeAPI.audit(payload);
        const flattenedFixes = flattenAuditReport(res.data.report);
        setAuditResults(flattenedFixes);
        toast.success("AI suggestions generated.");

    } catch (error) {
        toast.error("Failed to generate AI suggestions.");
        setActiveTab('manual'); 
    } finally {
        setIsAuditing(false);
    }
  };

  // PARSER: Handle Experience, Projects, Education, Skills
  const flattenAuditReport = (report) => {
    if (!report) return [];
    const fixes = [];
    
    const processPoints = (sectionName, dataArray) => {
        if (!Array.isArray(dataArray)) return;
        dataArray.forEach(item => {
            const points = item.points_audit || [];
            if (Array.isArray(points)) {
                points.forEach(pt => {
                    if (pt.suggestion && pt.suggestion !== pt.original) {
                        fixes.push({
                            section: sectionName,
                            context: item.company || item.title || item.role || sectionName,
                            original: pt.original,
                            suggestion: pt.suggestion,
                            reason: pt.reason || "AI Improvement",
                            subType: 'point'
                        });
                    }
                });
            }
        });
    };

    processPoints('experience', report.experience);
    processPoints('projects', report.projects);

    if (Array.isArray(report.education)) {
        report.education.forEach(item => {
            if (item.details_audit && item.details_audit.suggestion !== item.details_audit.original) {
                fixes.push({
                    section: 'education',
                    context: item.institute || "Education",
                    original: item.details_audit.original,
                    suggestion: item.details_audit.suggestion,
                    reason: item.details_audit.reason || "Enhanced details",
                    subType: 'field',
                    fieldName: 'details'
                });
            }
        });
    }

    if (report.skills) {
        Object.keys(report.skills).forEach(key => {
            if (key.endsWith('_audit')) {
                const auditItem = report.skills[key];
                const realFieldName = key.replace('_audit', '');
                
                if (auditItem && auditItem.suggestion !== auditItem.original) {
                    fixes.push({
                        section: 'skills',
                        context: realFieldName.charAt(0).toUpperCase() + realFieldName.slice(1),
                        original: auditItem.original,
                        suggestion: auditItem.suggestion,
                        reason: auditItem.reason || "Optimized keywords",
                        subType: 'skill',
                        fieldName: realFieldName
                    });
                }
            }
        });
    }

    return fixes;
  };

  // APPLIER: Handle All Section Types
  const applyFixToData = async (fix) => {
    const newData = JSON.parse(JSON.stringify(resumeData));
    let applied = false;
    let targetId = null;

    // Skills
    if (fix.section === 'skills') {
        const field = fix.fieldName; 
        if (newData.content.skills && newData.content.skills[field] !== undefined) {
            newData.content.skills[field] = fix.suggestion;
            applied = true;
            targetId = `skills-${field}`;
        }
    }
    // Arrays (Exp, Proj, Edu)
    else if (Array.isArray(newData.content[fix.section])) {
        const sectionArr = newData.content[fix.section];
        
        for (let i = 0; i < sectionArr.length; i++) {
            const item = sectionArr[i];

            // Sub-case A: Bullet Points
            if (fix.subType === 'point' && item.points && Array.isArray(item.points)) {
                const ptIndex = item.points.findIndex(pt => pt.includes(fix.original) || fix.original.includes(pt));
                if (ptIndex !== -1) {
                    item.points[ptIndex] = fix.suggestion;
                    applied = true;
                    targetId = `${fix.section}-${i}-point-${ptIndex}`;
                    break;
                }
            }
            
            // Sub-case B: Specific Fields
            if (fix.subType === 'field' && fix.fieldName && item[fix.fieldName]) {
                if (item[fix.fieldName].includes(fix.original) || fix.original.includes(item[fix.fieldName])) {
                    item[fix.fieldName] = fix.suggestion;
                    applied = true;
                    targetId = `${fix.section}-${i}-${fix.fieldName}`;
                    break;
                }
            }
        }
    }

    if (applied) {
        setResumeData(newData);
        await handleSave(newData);
        // We do NOT switch tabs automatically. FixListPanel updates its UI.
        return targetId; 
    } else {
        toast.error("Could not find original text. It might have been changed manually.");
        return null;
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-[#00c29f]" size={40}/></div>;

  const SectionHeader = ({ title, id, isOpen, onClick }) => (
      <button onClick={onClick} className={`w-full flex items-center justify-between p-4 font-bold text-gray-800 border-b border-gray-100 hover:bg-gray-50 transition-colors ${isOpen ? 'bg-gray-50' : ''}`}>
          {title}
          {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col h-screen overflow-hidden">
      {/* Internal Style for Flash Animation */}
      <style>{`
        @keyframes flash {
          0% { background-color: rgba(0, 194, 159, 0.2); box-shadow: 0 0 0 2px #00c29f; }
          100% { background-color: transparent; box-shadow: none; }
        }
        .animate-flash { animation: flash 2s ease-out forwards; }
      `}</style>

      {/* Header */}
      <header className="bg-white border-b border-gray-200 h-16 px-6 flex items-center justify-between flex-shrink-0 z-20">
        <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="text-gray-500 hover:text-gray-900"><ArrowLeft size={20} /></button>
            <input className="font-bold text-gray-900 border-none p-0 focus:ring-0 text-lg placeholder-gray-400 bg-transparent" value={resumeData?.versionName || ''} onChange={(e) => setResumeData({...resumeData, versionName: e.target.value})} placeholder="Untitled Resume" />
        </div>
        <div className="flex items-center gap-3">
            <Button 
                variant="outline" 
                onClick={() => setShowCoverLetter(true)} 
                className="h-9 px-4 text-gray-700 border-gray-300 hover:bg-gray-50"
            >
                <FileText size={16} className="mr-2 text-purple-600" /> Cover Letter
            </Button>
            <Button variant="outline" onClick={() => setShowAtsModal(true)} className="h-9 px-4 border-indigo-200 text-indigo-600 hover:bg-indigo-50"><Target size={16} className="mr-2" /> Target Match</Button>
            <Button variant="ghost" onClick={() => handleSave()} disabled={saving} className="h-9 px-4 text-gray-600">{saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} className="mr-2" />} Save</Button>
            <Button onClick={() => {}} disabled={!pdfUrl || compiling} className="h-9 px-4"><Download size={18} className="mr-2" /> Download</Button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Left Panel: Editor & Fixes */}
        <div className="w-1/2 flex flex-col border-r border-gray-200 bg-white">
            <div className="flex border-b border-gray-200">
                <button onClick={() => setActiveTab('manual')} className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'manual' ? 'text-[#00c29f] border-b-2 border-[#00c29f] bg-teal-50/50' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`}><Edit3 size={16} /> Manual Edit</button>
                <button onClick={() => { if(auditResults.length > 0) setActiveTab('fix'); else toast.error("Run a scan first!"); }} className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'fix' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`}><Wand2 size={16} /> AI Fixes</button>
            </div>

            <div className="flex-1 overflow-y-auto pb-32 custom-scrollbar">
                {activeTab === 'fix' ? (
                    <FixListPanel 
                        auditReport={auditResults} 
                        onApplyFix={async (fix) => {
                            return await applyFixToData(fix);
                        }} 
                        loading={saving} 
                    />
                ) : (
                    <>
                        {/* 1. Personal Info */}
                        <div>
                            <SectionHeader title="Personal Information" isOpen={activeSection === 'personal'} onClick={() => setActiveSection(activeSection === 'personal' ? '' : 'personal')} />
                            {activeSection === 'personal' && (
                                <div className="p-6 space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input label="Full Name" value={resumeData.content.personalInfo.name} onChange={e => handlePersonalInfoChange('name', e.target.value)} />
                                        <Input label="Email" value={resumeData.content.personalInfo.email} onChange={e => handlePersonalInfoChange('email', e.target.value)} />
                                        <Input label="Phone" value={resumeData.content.personalInfo.phone} onChange={e => handlePersonalInfoChange('phone', e.target.value)} />
                                        <Input label="Location" value={resumeData.content.personalInfo.location} onChange={e => handlePersonalInfoChange('location', e.target.value)} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input label="LinkedIn" value={resumeData.content.personalInfo.linkedin} onChange={e => handlePersonalInfoChange('linkedin', e.target.value)} />
                                        <Input label="GitHub" value={resumeData.content.personalInfo.github} onChange={e => handlePersonalInfoChange('github', e.target.value)} />
                                        <Input label="Portfolio" value={resumeData.content.personalInfo.portfolio} onChange={e => handlePersonalInfoChange('portfolio', e.target.value)} />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 2. Experience */}
                        <div>
                            <SectionHeader title="Work Experience" isOpen={activeSection === 'experience'} onClick={() => setActiveSection(activeSection === 'experience' ? '' : 'experience')} />
                            {activeSection === 'experience' && (
                                <div className="p-6 space-y-6 bg-gray-50/50">
                                    {resumeData.content.experience.map((exp, index) => (
                                        <div key={index} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 relative group">
                                            <button onClick={() => removeArrayItem('experience', index)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                                            <div className="grid grid-cols-2 gap-3 mb-3">
                                                <Input label="Company" value={exp.company} onChange={e => handleArrayChange('experience', index, 'company', e.target.value)} />
                                                <Input label="Role" value={exp.role} onChange={e => handleArrayChange('experience', index, 'role', e.target.value)} />
                                                <Input label="Duration" value={exp.duration} onChange={e => handleArrayChange('experience', index, 'duration', e.target.value)} />
                                                <Input label="Location" value={exp.location} onChange={e => handleArrayChange('experience', index, 'location', e.target.value)} />
                                            </div>
                                            <label className="text-xs font-bold text-gray-500 uppercase">Achievements</label>
                                            {exp.points.map((point, pIndex) => {
                                                const currentId = `experience-${index}-point-${pIndex}`;
                                                return (
                                                    <div key={pIndex} className="flex gap-2 mt-2">
                                                        <input 
                                                            id={currentId} 
                                                            className={`flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-[#00c29f] outline-none transition-all ${highlightId === currentId ? 'animate-flash' : ''}`} 
                                                            value={point} 
                                                            onChange={e => handlePointChange('experience', index, pIndex, e.target.value)} 
                                                        />
                                                        <button onClick={() => removePoint('experience', index, pIndex)} className="text-gray-300 hover:text-red-500"><X size={14}/></button>
                                                    </div>
                                                );
                                            })}
                                            <button onClick={() => addPoint('experience', index)} className="mt-2 text-xs font-bold text-[#00c29f] flex items-center gap-1 hover:underline"><Plus size={12}/> Add Bullet Point</button>
                                        </div>
                                    ))}
                                    <Button variant="outline" onClick={() => addArrayItem('experience', { company: '', role: '', duration: '', location: '', points: [''] })} className="w-full border-dashed"><Plus size={16} className="mr-2"/> Add Position</Button>
                                </div>
                            )}
                        </div>

                        {/* 3. Projects */}
                        <div>
                            <SectionHeader title="Projects" isOpen={activeSection === 'projects'} onClick={() => setActiveSection(activeSection === 'projects' ? '' : 'projects')} />
                            {activeSection === 'projects' && (
                                <div className="p-6 space-y-6 bg-gray-50/50">
                                    {resumeData.content.projects.map((proj, index) => (
                                        <div key={index} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 relative group">
                                            <button onClick={() => removeArrayItem('projects', index)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                                            <div className="grid grid-cols-2 gap-3 mb-3">
                                                <Input label="Title" value={proj.title} onChange={e => handleArrayChange('projects', index, 'title', e.target.value)} />
                                                <Input label="Tech Stack" value={proj.tech} onChange={e => handleArrayChange('projects', index, 'tech', e.target.value)} />
                                                <Input label="Link" value={proj.link} onChange={e => handleArrayChange('projects', index, 'link', e.target.value)} />
                                                <Input label="Date" value={proj.date} onChange={e => handleArrayChange('projects', index, 'date', e.target.value)} />
                                            </div>
                                            <label className="text-xs font-bold text-gray-500 uppercase">Details</label>
                                            {proj.points.map((point, pIndex) => {
                                                const currentId = `projects-${index}-point-${pIndex}`;
                                                return (
                                                    <div key={pIndex} className="flex gap-2 mt-2">
                                                        <input 
                                                            id={currentId} 
                                                            className={`flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-[#00c29f] outline-none transition-all ${highlightId === currentId ? 'animate-flash' : ''}`}
                                                            value={point} 
                                                            onChange={e => handlePointChange('projects', index, pIndex, e.target.value)} 
                                                        />
                                                        <button onClick={() => removePoint('projects', index, pIndex)} className="text-gray-300 hover:text-red-500"><X size={14}/></button>
                                                    </div>
                                                );
                                            })}
                                            <button onClick={() => addPoint('projects', index)} className="mt-2 text-xs font-bold text-[#00c29f] flex items-center gap-1 hover:underline"><Plus size={12}/> Add Bullet Point</button>
                                        </div>
                                    ))}
                                    <Button variant="outline" onClick={() => addArrayItem('projects', { title: '', tech: '', link: '', date: '', points: [''] })} className="w-full border-dashed"><Plus size={16} className="mr-2"/> Add Project</Button>
                                </div>
                            )}
                        </div>

                        {/* 4. Education */}
                        <div>
                            <SectionHeader title="Education" isOpen={activeSection === 'education'} onClick={() => setActiveSection(activeSection === 'education' ? '' : 'education')} />
                            {activeSection === 'education' && (
                                <div className="p-6 space-y-4 bg-gray-50/50">
                                    {resumeData.content.education.map((edu, index) => {
                                        const currentId = `education-${index}-details`;
                                        return (
                                            <div key={index} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 relative">
                                                <button onClick={() => removeArrayItem('education', index)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                                                <Input label="Institute" value={edu.institute} onChange={e => handleArrayChange('education', index, 'institute', e.target.value)} className="mb-2"/>
                                                {/* Inside Education Map Loop */}
                                                <div className="grid grid-cols-2 gap-2">
                                                    <Input label="Duration" value={edu.duration} onChange={e => handleArrayChange('education', index, 'duration', e.target.value)} />
                                                    
                                                    {/* FIX for Education Details */}
                                                    <div className={highlightId === currentId ? 'animate-flash rounded-lg' : ''}>
                                                        <Input 
                                                            id={currentId} 
                                                            label="Degree/Details" 
                                                            value={edu.details} 
                                                            onChange={e => handleArrayChange('education', index, 'details', e.target.value)} 
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <Button variant="outline" onClick={() => addArrayItem('education', { institute: '', duration: '', details: '' })} className="w-full border-dashed"><Plus size={16} className="mr-2"/> Add Education</Button>
                                </div>
                            )}
                        </div>

                        {/* 5. Skills */}
                        <div>
                            <SectionHeader title="Skills" isOpen={activeSection === 'skills'} onClick={() => setActiveSection(activeSection === 'skills' ? '' : 'skills')} />
                            {activeSection === 'skills' && (
                                <div className="p-6 space-y-4">
                                        <Input id="skills-languages" className={highlightId === 'skills-languages' ? 'animate-flash' : ''} label="Languages" value={resumeData.content.skills.languages} onChange={e => handleSkillChange('languages', e.target.value)} />
                                        <Input id="skills-frameworks" className={highlightId === 'skills-frameworks' ? 'animate-flash' : ''} label="Frameworks" value={resumeData.content.skills.frameworks} onChange={e => handleSkillChange('frameworks', e.target.value)} />
                                        <Input id="skills-tools" className={highlightId === 'skills-tools' ? 'animate-flash' : ''} label="Tools" value={resumeData.content.skills.tools} onChange={e => handleSkillChange('tools', e.target.value)} />
                                        <Input id="skills-databases" className={highlightId === 'skills-databases' ? 'animate-flash' : ''} label="Databases" value={resumeData.content.skills.databases} onChange={e => handleSkillChange('databases', e.target.value)} />
                                </div>
                            )}
                        </div>

                        {/* 6. Certifications */}
                        <div>
                            <SectionHeader title="Certifications" isOpen={activeSection === 'certifications'} onClick={() => setActiveSection(activeSection === 'certifications' ? '' : 'certifications')} />
                            {activeSection === 'certifications' && (
                                <div className="p-6 space-y-4 bg-gray-50/50">
                                    {(resumeData.content.certifications || []).map((cert, index) => {
                                        const currentId = `certifications-${index}-name`;
                                        return (
                                            <div key={index} className="bg-white p-3 rounded-xl border border-gray-100 flex flex-col gap-2 relative">
                                                <button onClick={() => removeArrayItem('certifications', index)} className="absolute top-3 right-3 text-gray-400 hover:text-red-500"><X size={16}/></button>
                                                
                                                {/* FIX: Applied animation to a wrapper div instead of Input directly */}
                                                <div className={highlightId === currentId ? 'animate-flash rounded-lg' : ''}>
                                                    <Input 
                                                        id={currentId} 
                                                        label="Certificate Name" 
                                                        value={cert.name} 
                                                        onChange={e => handleSimpleArrayChange('certifications', index, 'name', e.target.value)} 
                                                    />
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <LinkIcon size={14} className="text-gray-400" />
                                                    <input className="flex-1 text-sm border-b border-gray-200 focus:border-[#00c29f] outline-none py-1 bg-transparent placeholder-gray-400" value={cert.link} onChange={e => handleSimpleArrayChange('certifications', index, 'link', e.target.value)} placeholder="Certificate URL (Optional)" />
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <Button variant="outline" onClick={() => addSimpleListItem('certifications')} className="w-full border-dashed"><Plus size={16} className="mr-2"/> Add Certificate</Button>
                                </div>
                            )}
                        </div>

                        {/* 7. Achievements */}
                        <div>
                            <SectionHeader title="Achievements" isOpen={activeSection === 'achievements'} onClick={() => setActiveSection(activeSection === 'achievements' ? '' : 'achievements')} />
                            {activeSection === 'achievements' && (
                                <div className="p-6 space-y-4 bg-gray-50/50">
                                    {(resumeData.content.achievements || []).map((ach, index) => {
                                        const currentId = `achievements-${index}-name`;
                                        return (
                                            <div key={index} className="bg-white p-3 rounded-xl border border-gray-100 flex flex-col gap-2 relative">
                                                <button onClick={() => removeArrayItem('achievements', index)} className="absolute top-3 right-3 text-gray-400 hover:text-red-500"><X size={16}/></button>
                                                
                                                {/* FIX: Applied animation to a wrapper div */}
                                                <div className={highlightId === currentId ? 'animate-flash rounded-lg' : ''}>
                                                    <Input 
                                                        id={currentId} 
                                                        label="Achievement Detail" 
                                                        value={ach.name} 
                                                        onChange={e => handleSimpleArrayChange('achievements', index, 'name', e.target.value)} 
                                                    />
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <LinkIcon size={14} className="text-gray-400" />
                                                    <input className="flex-1 text-sm border-b border-gray-200 focus:border-[#00c29f] outline-none py-1 bg-transparent placeholder-gray-400" value={ach.link} onChange={e => handleSimpleArrayChange('achievements', index, 'link', e.target.value)} placeholder="Proof URL (Optional)" />
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <Button variant="outline" onClick={() => addSimpleListItem('achievements')} className="w-full border-dashed"><Plus size={16} className="mr-2"/> Add Achievement</Button>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>

        {/* Right Panel: PDF Preview */}
        <div className="w-1/2 bg-gray-100 flex flex-col relative border-l border-gray-200">
             {compiling && <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center"><Loader2 className="animate-spin text-[#00c29f]"/></div>}
             <div className="flex-1 p-8 h-full">
                {pdfUrl ? <iframe src={`${pdfUrl}#toolbar=0&navpanes=0`} className="w-full h-full rounded-lg shadow-2xl border border-gray-200" title="Resume Preview"/> : <div className="w-full h-full flex items-center justify-center text-gray-400">Generating Preview...</div>}
             </div>
        </div>
      </main>

      {/* ATS Modal */}
      {showAtsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2"><Target className="text-[#00c29f]" /> ATS Target Match</h3>
                    <button onClick={() => setShowAtsModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                </div>
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    {!atsResult ? (
                        <div className="space-y-4">
                            <p className="text-gray-600 text-sm">Paste the job description below to check your score.</p>
                            <TextArea placeholder="Paste JD here..." className="h-64 font-mono text-sm" value={atsJd} onChange={(e) => setAtsJd(e.target.value)} />
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between bg-gray-900 text-white p-6 rounded-xl">
                                <div><p className="text-gray-400 text-xs uppercase">Score</p><p className="text-4xl font-bold">{atsResult.ats_score}%</p></div>
                                <div className="text-right max-w-xs"><p className="text-sm text-gray-300 italic">"{atsResult.summary}"</p></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-green-50 rounded-xl border border-green-100"><h4 className="font-bold text-green-700 mb-2">Strengths</h4><ul className="list-disc list-inside text-sm text-gray-600 space-y-1">{atsResult.strengths?.map((s,i)=><li key={i}>{s}</li>)}</ul></div>
                                <div className="p-4 bg-orange-50 rounded-xl border border-orange-100"><h4 className="font-bold text-orange-700 mb-2">Improvements</h4><ul className="list-disc list-inside text-sm text-gray-600 space-y-1">{atsResult.improvements?.map((s,i)=><li key={i}>{s}</li>)}</ul></div>
                            </div>
                        </div>
                    )}
                </div>
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                    {!atsResult ? <Button onClick={runAtsCheck} loading={analyzing} disabled={!atsJd}>Run Analysis</Button> : <> <Button variant="outline" onClick={() => { setAtsResult(null); setAtsJd(''); }}>Check Another</Button> <Button onClick={enableFixMode} className="bg-indigo-600 hover:bg-indigo-700"><Wand2 size={16} className="mr-2" /> Fix Resume</Button> </>}
                </div>
            </div>
        </div>
      )}

      {showCoverLetter && (
        <CoverLetterModal 
            resumeData={resumeData?.content} 
            onClose={() => setShowCoverLetter(false)} 
        />
      )}
    </div>
  );
};

export default ResumeEditor;