import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { resumeAPI } from '../lib/api';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { 
    User, Briefcase, GraduationCap, Code, CheckCircle, Plus, Trash2, 
    ArrowRight, ArrowLeft, UploadCloud, FileText, Layout, Loader2, Award, Star,
    Save 
} from 'lucide-react';
import { useToast } from '../context/ToastContext';


const STEPS = [
  { id: 1, title: 'Personal Info', icon: User },
  { id: 2, title: 'Experience', icon: Briefcase },
  { id: 3, title: 'Projects', icon: Code },
  { id: 4, title: 'Education & Skills', icon: GraduationCap },
];

const CreateResume = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  
  // State 0 = Selection Screen, 1-4 = Wizard Steps
  const [currentStep, setCurrentStep] = useState(0); 
  const [loading, setLoading] = useState(false);
  const [fetchingMaster, setFetchingMaster] = useState(false);
  
  // NEW: Master Profile Sync Checkbox
  const [updateMaster, setUpdateMaster] = useState(false);

  // Default Empty State
  const defaultState = {
    NAME: '', EMAIL: '', PHONE: '', LOCATION: '', LINKEDIN: '', GITHUB: '', PORTFOLIO: '',
    EXPERIENCE: [{ COMPANY: '', ROLE: '', DURATION: '', LOCATION: '', POINTS: [''] }],
    PROJECTS: [{ TITLE: '', LINK: '', TECH: '', DATE: '', POINTS: [''] }],
    EDUCATION: [{ INSTITUTE: '', DURATION: '', DETAILS: '' }],
    SKILLS: { LANGUAGES: '', FRAMEWORKS_LIBRARIES: '', TOOLS: '', DATABASES: '' },
    // ADDED NEW FIELDS HERE
    CERTIFICATIONS: [], 
    ACHIEVEMENTS: [] 
  };

  const [formData, setFormData] = useState(defaultState);

  // Effect: Check if we were redirected from "Import Resume" page with data
  useEffect(() => {
    if (location.state?.prefilledData) {
        // Ensure Certs/Achievements are initialized even if parser returned undefined
        const incomingData = {
            ...defaultState,
            ...location.state.prefilledData,
            // Ensure they are arrays
            CERTIFICATIONS: location.state.prefilledData.certifications || [],
            ACHIEVEMENTS: location.state.prefilledData.achievements || []
        };
        setFormData(incomingData);
        setCurrentStep(1); // Skip selection
    }
  }, [location.state]);

  // --- Handlers ---

  const handleMasterLoad = async () => {
    setFetchingMaster(true);
    try {
        const res = await resumeAPI.getProfile();
        if (res.data?.data) {
            const mp = res.data.data;
            const normalized = {
                NAME: mp.personalInfo?.name || '',
                EMAIL: mp.personalInfo?.email || '',
                PHONE: mp.personalInfo?.phone || '',
                LOCATION: mp.personalInfo?.location || '',
                LINKEDIN: mp.personalInfo?.linkedin || '',
                GITHUB: mp.personalInfo?.github || '',
                PORTFOLIO: mp.personalInfo?.portfolio || '',
                EXPERIENCE: mp.experience?.map(e => ({...e, POINTS: e.points})) || defaultState.EXPERIENCE,
                PROJECTS: mp.projects?.map(p => ({...p, POINTS: p.points, TITLE: p.title, TECH: p.tech, LINK: p.link, DATE: p.date})) || defaultState.PROJECTS,
                EDUCATION: mp.education?.map(e => ({...e, INSTITUTE: e.institute, DURATION: e.duration, DETAILS: e.details})) || defaultState.EDUCATION,
                SKILLS: {
                    LANGUAGES: Array.isArray(mp.skills?.languages) ? mp.skills.languages.join(', ') : mp.skills?.languages || '',
                    FRAMEWORKS_LIBRARIES: Array.isArray(mp.skills?.frameworks) ? mp.skills.frameworks.join(', ') : mp.skills?.frameworks || '',
                    TOOLS: Array.isArray(mp.skills?.tools) ? mp.skills.tools.join(', ') : mp.skills?.tools || '',
                    DATABASES: Array.isArray(mp.skills?.databases) ? mp.skills.databases.join(', ') : mp.skills?.databases || '',
                },
                // Load Certs/Achievements from Master Profile (if they exist)
                CERTIFICATIONS: mp.certifications || [],
                ACHIEVEMENTS: mp.achievements || []
            };
            setFormData(normalized);
            setCurrentStep(1);
        } else {
            toast.error("No Master Profile found. Please create one or start from scratch.");
        }
    } catch (error) {
        toast.error("Failed to load Master Profile.");
    } finally {
        setFetchingMaster(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (section, index, field, value) => {
    const updated = [...formData[section]];
    updated[index][field] = value;
    setFormData(prev => ({ ...prev, [section]: updated }));
  };

  const handleNestedArrayChange = (section, itemIndex, arrayField, pointIndex, value) => {
    const updated = [...formData[section]];
    updated[itemIndex][arrayField][pointIndex] = value;
    setFormData(prev => ({ ...prev, [section]: updated }));
  };

  const addItem = (section, template) => {
    setFormData(prev => ({ ...prev, [section]: [...prev[section], template] }));
  };

  const removeItem = (section, index) => {
    setFormData(prev => ({ ...prev, [section]: prev[section].filter((_, i) => i !== index) }));
  };

  // NEW HANDLERS FOR OBJECT LISTS (Certs/Achievements)
  const handleSimpleArrayChange = (section, index, field, value) => {
      const updated = [...formData[section]];
      // Ensure object exists
      if (!updated[index]) updated[index] = { name: '', link: '' };
      
      // If it's a string (legacy data), convert to object first
      if (typeof updated[index] === 'string') {
          updated[index] = { name: updated[index], link: '' };
      }
      
      updated[index][field] = value;
      setFormData(prev => ({ ...prev, [section]: updated }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Transform keys to match Schema (lowercase)
      const payloadData = {
          personalInfo: {
              name: formData.NAME, email: formData.EMAIL, phone: formData.PHONE,
              location: formData.LOCATION, linkedin: formData.LINKEDIN,
              github: formData.GITHUB, portfolio: formData.PORTFOLIO
          },
          experience: formData.EXPERIENCE.map(e => ({
              company: e.COMPANY, role: e.ROLE, duration: e.DURATION, location: e.LOCATION, points: e.POINTS
          })),
          projects: formData.PROJECTS.map(p => ({
              title: p.TITLE, link: p.LINK, tech: p.TECH, date: p.DATE, points: p.POINTS
          })),
          education: formData.EDUCATION.map(e => ({
              institute: e.INSTITUTE, duration: e.DURATION, details: e.DETAILS
          })),
          skills: {
              languages: formData.SKILLS.LANGUAGES,
              frameworks: formData.SKILLS.FRAMEWORKS_LIBRARIES,
              tools: formData.SKILLS.TOOLS,
              databases: formData.SKILLS.DATABASES
          },
          // SEND NEW FIELDS
          certifications: formData.CERTIFICATIONS,
          achievements: formData.ACHIEVEMENTS
      };

      // SEND THE FLAG TO BACKEND
      const res = await resumeAPI.create({ 
          userData: payloadData,
          updateMaster: updateMaster 
      });
      
      if (res.data.success) {
        toast.success("Resume created successfully!");
        navigate(`/editor/${res.data.resumeId}`);
      }
    } catch (error) {
      toast.error("Failed to create profile. Please check your input.");
    } finally {
      setLoading(false);
    }
  };

  // --- RENDER: Selection Screen (Step 0) ---
  if (currentStep === 0) {
      return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-12 animate-fade-in-up">
                    <h1 className="text-4xl font-bold font-display text-gray-900 mb-4">How do you want to start?</h1>
                    <p className="text-gray-500 text-lg">Choose a method to build your ATS-optimized resume.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Option 1: From Scratch */}
                    <div 
                        onClick={() => setCurrentStep(1)}
                        className="group bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-[#00c29f]/30 transition-all cursor-pointer relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Layout size={100} className="text-gray-900"/>
                        </div>
                        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <Plus size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Start from Scratch</h3>
                        <p className="text-gray-500 mb-6">Build your resume step-by-step using our blank template wizard.</p>
                        <span className="text-blue-600 font-bold flex items-center group-hover:translate-x-1 transition-transform">
                            Create New <ArrowRight size={16} className="ml-2"/>
                        </span>
                    </div>

                    {/* Option 2: Import */}
                    <div 
                        onClick={() => navigate('/import-resume')}
                        className="group bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-[#00c29f]/30 transition-all cursor-pointer relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <UploadCloud size={100} className="text-gray-900"/>
                        </div>
                        <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <FileText size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Import Resume</h3>
                        <p className="text-gray-500 mb-6">Upload an existing PDF. Our AI will extract your data instantly.</p>
                        <span className="text-purple-600 font-bold flex items-center group-hover:translate-x-1 transition-transform">
                            Upload PDF <ArrowRight size={16} className="ml-2"/>
                        </span>
                    </div>

                    {/* Option 3: Master Profile */}
                    <div 
                        onClick={handleMasterLoad}
                        className="group bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-[#00c29f]/30 transition-all cursor-pointer relative overflow-hidden"
                    >
                         <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <User size={100} className="text-gray-900"/>
                        </div>
                        <div className="w-16 h-16 bg-[#00c29f]/10 text-[#00c29f] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            {fetchingMaster ? <Loader2 className="animate-spin" size={32}/> : <User size={32} />}
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Use Master Profile</h3>
                        <p className="text-gray-500 mb-6">Pre-fill with data from your saved central profile.</p>
                        <span className="text-[#00c29f] font-bold flex items-center group-hover:translate-x-1 transition-transform">
                            Load Data <ArrowRight size={16} className="ml-2"/>
                        </span>
                    </div>
                </div>
            </div>
        </div>
      );
  }

  // --- RENDER: Wizard Steps (1-4) ---
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
           <h1 className="text-xl font-bold font-display text-gray-900">Create Profile</h1>
           <div className="flex items-center gap-2 text-sm text-gray-500">
              Step <span className="text-[#00c29f] font-bold">{currentStep}</span> of {STEPS.length}
           </div>
        </div>
        {/* Progress Bar */}
        <div className="h-1 bg-gray-100 w-full">
            <div 
                className="h-full bg-[#00c29f] transition-all duration-500 ease-out" 
                style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
            ></div>
        </div>
      </div>

      <div className="flex-1 max-w-4xl mx-auto w-full p-6 pb-24">
        
        {/* Step 1: Personal Info */}
        {currentStep === 1 && (
            <div className="space-y-6 animate-fade-in-up">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        <User className="text-[#00c29f]" /> Personal Details
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Full Name" value={formData.NAME} onChange={e => handleChange('NAME', e.target.value)} placeholder="e.g. John Doe" />
                        <Input label="Email" value={formData.EMAIL} onChange={e => handleChange('EMAIL', e.target.value)} placeholder="e.g. john@work.com" />
                        <Input label="Phone" value={formData.PHONE} onChange={e => handleChange('PHONE', e.target.value)} placeholder="e.g. +1 234 567 890" />
                        <Input label="Location" value={formData.LOCATION} onChange={e => handleChange('LOCATION', e.target.value)} placeholder="e.g. New York, USA" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <Input label="LinkedIn URL" value={formData.LINKEDIN} onChange={e => handleChange('LINKEDIN', e.target.value)} />
                        <Input label="GitHub URL" value={formData.GITHUB} onChange={e => handleChange('GITHUB', e.target.value)} />
                        <Input label="Portfolio URL" value={formData.PORTFOLIO} onChange={e => handleChange('PORTFOLIO', e.target.value)} />
                    </div>
                </div>
            </div>
        )}

        {/* Step 2: Experience */}
        {currentStep === 2 && (
            <div className="space-y-6 animate-fade-in-up">
                <div className="flex justify-between items-center mb-4">
                      <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Briefcase className="text-[#00c29f]" /> Work Experience
                    </h2>
                    <Button 
                        variant="outline" 
                        onClick={() => addItem('EXPERIENCE', { COMPANY: '', ROLE: '', DURATION: '', LOCATION: '', POINTS: [''] })}
                        className="py-2 px-4 text-sm"
                    >
                        <Plus size={16} className="mr-2" /> Add Position
                    </Button>
                </div>

                {formData.EXPERIENCE.map((exp, index) => (
                    <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative group">
                        <button 
                            onClick={() => removeItem('EXPERIENCE', index)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors"
                        >
                            <Trash2 size={18} />
                        </button>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <Input label="Company" value={exp.COMPANY} onChange={e => handleArrayChange('EXPERIENCE', index, 'COMPANY', e.target.value)} />
                            <Input label="Role" value={exp.ROLE} onChange={e => handleArrayChange('EXPERIENCE', index, 'ROLE', e.target.value)} />
                            <Input label="Duration" value={exp.DURATION} onChange={e => handleArrayChange('EXPERIENCE', index, 'DURATION', e.target.value)} placeholder="Jan 2022 - Present" />
                            <Input label="Location" value={exp.LOCATION} onChange={e => handleArrayChange('EXPERIENCE', index, 'LOCATION', e.target.value)} />
                        </div>
                        
                        <label className="block text-sm font-medium text-gray-700 mb-2">Key Achievements (Bullet Points)</label>
                        {exp.POINTS.map((point, pIndex) => (
                            <div key={pIndex} className="flex gap-2 mb-2">
                                <input 
                                    className="flex-1 px-4 py-2 rounded-lg border border-gray-200 focus:border-[#00c29f] outline-none"
                                    value={point}
                                    onChange={e => handleNestedArrayChange('EXPERIENCE', index, 'POINTS', pIndex, e.target.value)}
                                    placeholder="• Built a scalable API..."
                                />
                                {pIndex === exp.POINTS.length - 1 && (
                                    <button 
                                        onClick={() => {
                                            const newPoints = [...exp.POINTS, ''];
                                            handleArrayChange('EXPERIENCE', index, 'POINTS', newPoints);
                                        }}
                                        className="p-2 text-[#00c29f] hover:bg-[#00c29f]/10 rounded-lg"
                                    >
                                        <Plus size={18} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        )}

        {/* Step 3: Projects */}
        {currentStep === 3 && (
            <div className="space-y-6 animate-fade-in-up">
                 <div className="flex justify-between items-center mb-4">
                      <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Code className="text-[#00c29f]" /> Projects
                    </h2>
                    <Button 
                        variant="outline" 
                        onClick={() => addItem('PROJECTS', { TITLE: '', LINK: '', TECH: '', DATE: '', POINTS: [''] })}
                        className="py-2 px-4 text-sm"
                    >
                        <Plus size={16} className="mr-2" /> Add Project
                    </Button>
                </div>

                {formData.PROJECTS.map((proj, index) => (
                    <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative">
                        <button 
                            onClick={() => removeItem('PROJECTS', index)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors"
                        >
                            <Trash2 size={18} />
                        </button>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <Input label="Project Title" value={proj.TITLE} onChange={e => handleArrayChange('PROJECTS', index, 'TITLE', e.target.value)} />
                            <Input label="Tech Stack" value={proj.TECH} onChange={e => handleArrayChange('PROJECTS', index, 'TECH', e.target.value)} placeholder="React, Node.js, MongoDB" />
                            <Input label="Link" value={proj.LINK} onChange={e => handleArrayChange('PROJECTS', index, 'LINK', e.target.value)} />
                            <Input label="Date" value={proj.DATE} onChange={e => handleArrayChange('PROJECTS', index, 'DATE', e.target.value)} />
                        </div>

                         <label className="block text-sm font-medium text-gray-700 mb-2">Description Points</label>
                        {proj.POINTS.map((point, pIndex) => (
                            <div key={pIndex} className="flex gap-2 mb-2">
                                <input 
                                    className="flex-1 px-4 py-2 rounded-lg border border-gray-200 focus:border-[#00c29f] outline-none"
                                    value={point}
                                    onChange={e => handleNestedArrayChange('PROJECTS', index, 'POINTS', pIndex, e.target.value)}
                                    placeholder="• Developed a full-stack application..."
                                />
                                {pIndex === proj.POINTS.length - 1 && (
                                    <button 
                                        onClick={() => {
                                            const newPoints = [...proj.POINTS, ''];
                                            handleArrayChange('PROJECTS', index, 'POINTS', newPoints);
                                        }}
                                        className="p-2 text-[#00c29f] hover:bg-[#00c29f]/10 rounded-lg"
                                    >
                                        <Plus size={18} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        )}

        {/* Step 4: Education & Skills (AND Certs/Achievements) */}
        {currentStep === 4 && (
            <div className="space-y-6 animate-fade-in-up">
                
                {/* EDUCATION */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        <GraduationCap className="text-[#00c29f]" /> Education
                    </h2>
                    {formData.EDUCATION.map((edu, index) => (
                        <div key={index} className="mb-6 p-4 bg-gray-50 rounded-xl relative">
                            <div className="grid grid-cols-1 gap-4">
                                <Input label="Institute / University" value={edu.INSTITUTE} onChange={e => handleArrayChange('EDUCATION', index, 'INSTITUTE', e.target.value)} />
                                <div className="grid grid-cols-2 gap-4">
                                    <Input label="Duration / Year" value={edu.DURATION} onChange={e => handleArrayChange('EDUCATION', index, 'DURATION', e.target.value)} />
                                    <Input label="Details (Degree/CGPA)" value={edu.DETAILS} onChange={e => handleArrayChange('EDUCATION', index, 'DETAILS', e.target.value)} />
                                </div>
                            </div>
                        </div>
                    ))}
                    <Button 
                        variant="ghost" 
                        onClick={() => addItem('EDUCATION', { INSTITUTE: '', DURATION: '', DETAILS: '' })}
                        className="text-sm"
                    >
                        + Add Another Education
                    </Button>
                </div>

                {/* SKILLS */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-2xl font-bold mb-6">Skills</h2>
                    <div className="grid grid-cols-1 gap-4">
                        <Input label="Languages" placeholder="Java, Python, JavaScript" value={formData.SKILLS.LANGUAGES} onChange={e => {
                             setFormData(prev => ({ ...prev, SKILLS: { ...prev.SKILLS, LANGUAGES: e.target.value } }));
                        }} />
                        <Input label="Frameworks & Libraries" placeholder="React, Spring Boot, Tailwind" value={formData.SKILLS.FRAMEWORKS_LIBRARIES} onChange={e => {
                             setFormData(prev => ({ ...prev, SKILLS: { ...prev.SKILLS, FRAMEWORKS_LIBRARIES: e.target.value } }));
                        }} />
                        <Input label="Tools" placeholder="Git, Docker, VS Code" value={formData.SKILLS.TOOLS} onChange={e => {
                             setFormData(prev => ({ ...prev, SKILLS: { ...prev.SKILLS, TOOLS: e.target.value } }));
                        }} />
                         <Input label="Databases" placeholder="MySQL, MongoDB" value={formData.SKILLS.DATABASES} onChange={e => {
                             setFormData(prev => ({ ...prev, SKILLS: { ...prev.SKILLS, DATABASES: e.target.value } }));
                        }} />
                    </div>
                </div>

                {/* CERTIFICATIONS SECTION */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        <Award className="text-[#00c29f]" /> Certifications
                    </h2>
                    {(formData.CERTIFICATIONS || []).map((cert, index) => (
                        <div key={index} className="flex gap-4 mb-4 items-start">
                            <div className="flex-1 space-y-2">
                                <Input 
                                    label="Certification Name" 
                                    value={cert.name || (typeof cert === 'string' ? cert : '')} 
                                    onChange={e => handleSimpleArrayChange('CERTIFICATIONS', index, 'name', e.target.value)} 
                                    placeholder="AWS Certified Solutions Architect"
                                />
                                <Input 
                                    label="Link (Optional)" 
                                    value={cert.link || ''} 
                                    onChange={e => handleSimpleArrayChange('CERTIFICATIONS', index, 'link', e.target.value)} 
                                    placeholder="https://..."
                                />
                            </div>
                            <button 
                                onClick={() => removeItem('CERTIFICATIONS', index)}
                                className="text-gray-400 hover:text-red-500 mt-8"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                    ))}
                    <Button 
                        variant="outline" 
                        onClick={() => addItem('CERTIFICATIONS', { name: '', link: '' })}
                        className="w-full border-dashed"
                    >
                        <Plus size={16} className="mr-2"/> Add Certification
                    </Button>
                </div>

                {/* ACHIEVEMENTS SECTION */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        <Star className="text-[#00c29f]" /> Achievements
                    </h2>
                    {(formData.ACHIEVEMENTS || []).map((ach, index) => (
                        <div key={index} className="flex gap-4 mb-4 items-start">
                            <div className="flex-1 space-y-2">
                                <Input 
                                    label="Achievement" 
                                    value={ach.name || (typeof ach === 'string' ? ach : '')} 
                                    onChange={e => handleSimpleArrayChange('ACHIEVEMENTS', index, 'name', e.target.value)} 
                                    placeholder="1st Place in Hackathon 2023"
                                />
                                <Input 
                                    label="Link (Optional)" 
                                    value={ach.link || ''} 
                                    onChange={e => handleSimpleArrayChange('ACHIEVEMENTS', index, 'link', e.target.value)} 
                                    placeholder="https://..."
                                />
                            </div>
                            <button 
                                onClick={() => removeItem('ACHIEVEMENTS', index)}
                                className="text-gray-400 hover:text-red-500 mt-8"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                    ))}
                    <Button 
                        variant="outline" 
                        onClick={() => addItem('ACHIEVEMENTS', { name: '', link: '' })}
                        className="w-full border-dashed"
                    >
                        <Plus size={16} className="mr-2"/> Add Achievement
                    </Button>
                </div>

                {/* MASTER SYNC CHECKBOX */}
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3 items-start mt-6">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-full shrink-0">
                        <Save size={18} />
                    </div>
                    <div>
                        <h4 className="font-bold text-blue-900 text-sm">Master Profile Sync</h4>
                        <p className="text-blue-700 text-xs mt-1 mb-2">
                            Do you want to save this data as your new default for future resumes?
                        </p>
                        <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900 select-none">
                            <input 
                                type="checkbox" 
                                checked={updateMaster}
                                onChange={(e) => setUpdateMaster(e.target.checked)}
                                className="w-4 h-4 rounded border-gray-300 text-[#00c29f] focus:ring-[#00c29f]"
                            />
                            Yes, update my Master Profile
                        </label>
                    </div>
                </div>

            </div>
        )}

      </div>

      {/* Footer / Navigation Actions */}
      <div className="bg-white border-t border-gray-200 fixed bottom-0 w-full z-30">
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
            <Button 
                variant="ghost" 
                onClick={() => setCurrentStep(prev => prev === 1 ? 0 : Math.max(1, prev - 1))}
                className={currentStep === 0 ? 'hidden' : ''}
            >
                <ArrowLeft className="mr-2" size={20}/> Back
            </Button>

            {currentStep < STEPS.length ? (
                <Button onClick={() => setCurrentStep(prev => Math.min(STEPS.length, prev + 1))}>
                    Next Step <ArrowRight className="ml-2" size={20}/>
                </Button>
            ) : (
                <Button onClick={handleSubmit} loading={loading}>
                    Create Resume <CheckCircle className="ml-2" size={20}/>
                </Button>
            )}
        </div>
      </div>
    </div>
  );
};

export default CreateResume;