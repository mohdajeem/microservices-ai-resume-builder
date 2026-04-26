import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { resumeAPI, atsAPI, compilerAPI } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { TextArea } from '../components/ui/TextArea';
import FixListPanel from '../components/FixListPanel'; 
import ScanHistory from '../components/ScanHistory';
import CoverLetterModal from '../components/CoverLetterModal';
import { 
    Loader2, Download, Save, ArrowLeft, Target, X, History,
    Trash2, ChevronDown, ChevronUp, Edit3, Wand2, Plus, Link as LinkIcon, FileText, Copy, RefreshCw
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

const ResumeEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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
  const [selectedScanId, setSelectedScanId] = useState(null);
  const [selectedScanTitle, setSelectedScanTitle] = useState('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isFetchingSmartSkills, setIsFetchingSmartSkills] = useState(false);
  const [smartSkills, setSmartSkills] = useState(null);
  const [previewMode, setPreviewMode] = useState('pdf'); // 'pdf' or 'latex'

  // --- Undo/Redo State ---
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const lastSavedState = useRef(null);
  
  // Audit State
  const [auditResults, setAuditResults] = useState([]);
  const [lineTradeInfo, setLineTradeInfo] = useState(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [isCompacting, setIsCompacting] = useState(false);
  const [calculatingId, setCalculatingId] = useState(null);

  // Highlight State
  const [highlightId, setHighlightId] = useState(null);

  // --- UNDO/REDO LOGIC ---
  const pushToUndo = (state) => {
    setUndoStack(prev => [...prev.slice(-49), JSON.parse(JSON.stringify(state))]);
    setRedoStack([]); // Clear redo on new action
  };

  const handleUndo = async () => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    const current = JSON.parse(JSON.stringify(resumeData.content));
    
    setRedoStack(prev => [...prev, current]);
    setUndoStack(prev => prev.slice(0, -1));
    
    const newResumeData = { ...resumeData, content: previous };
    setResumeData(newResumeData);
    lastSavedState.current = JSON.stringify(previous);
    
    // Automatically re-compile for Undo
    await handleSave(newResumeData);
    toast.success("Undo successful");
  };

  const handleRedo = async () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    const current = JSON.parse(JSON.stringify(resumeData.content));

    setUndoStack(prev => [...prev, current]);
    setRedoStack(prev => prev.slice(0, -1));

    const newResumeData = { ...resumeData, content: next };
    setResumeData(newResumeData);
    lastSavedState.current = JSON.stringify(next);
    
    // Automatically re-compile for Redo
    await handleSave(newResumeData);
    toast.success("Redo successful");
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
            if (e.shiftKey) handleRedo();
            else handleUndo();
        } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
            handleRedo();
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undoStack, redoStack, resumeData]);

  // Track changes for Undo
  useEffect(() => {
    if (!resumeData?.content) return;
    const currentStateStr = JSON.stringify(resumeData.content);
    
    if (!lastSavedState.current) {
        lastSavedState.current = currentStateStr;
        return;
    }

    if (currentStateStr !== lastSavedState.current) {
        const timer = setTimeout(() => {
            pushToUndo(JSON.parse(lastSavedState.current));
            lastSavedState.current = currentStateStr;
        }, 1000); // 1s debounce for typing
        return () => clearTimeout(timer);
    }
  }, [resumeData]);

  // --- EFFECTS ---
  useEffect(() => {
    fetchResumeAndPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    // If we're coming from Dashboard "Match", open modal immediately
    if (searchParams.get('match')) {
        setShowAtsModal(true);
    }
  }, [searchParams]);

  const handleScanSelection = async (scan) => {
    // If we already have the audit results for this scan, just scroll/view it
    if (selectedScanId === scan._id && auditResults.length > 0) {
        setActiveTab('fix');
        return;
    }
    
    setSelectedScanId(scan._id);
    setSelectedScanTitle(scan.jdTitle || 'Selected Job'); 
    setAtsJd(scan.jdText);
    
    // Set explicit ATS Result from History
    const resultToSet = {
        _id: scan._id,
        ats_score: scan.score,
        summary: scan.analysis?.summary || "",
        strengths: scan.analysis?.strengths || [],
        improvements: scan.analysis?.improvements || [],
        keywords_found: scan.analysis?.keywords_found || [],
        keywords_missing: scan.analysis?.keywords_missing || [],
        match_gap: scan.match_gap || {}
    };
    setAtsResult(resultToSet);

    // Automatically trigger an audit for this historical scan 
    // This ensures "AI Fixes" tab has context-aware suggestions
    setIsAuditing(true);
    setAuditResults([]); // Clear previous results while loading
    
    try {
        const payload = {
            resumeData: resumeData.content,
            jobDescription: scan.jdText,
            atsImprovements: scan.analysis?.improvements || [],
            compactMode: resumeData.compactMode === true
        };
        const res = await resumeAPI.audit(payload);
        console.log("[DEBUG-HISTORY] Audit Raw Response:", res.data);
        
        // Handle various response patterns. Backend typically returns { success, report }
        const reportData = res.data.data?.report || res.data.report || res.data.data || res.data; 
        console.log("[DEBUG-HISTORY] Extracted Report Data:", reportData);

        // Extract Line Trade Info
        if (reportData.lineTrade) {
            setLineTradeInfo(reportData.lineTrade);
        } else {
            setLineTradeInfo(null);
        }

        const flattenedFixes = flattenAuditReport(reportData);
        console.log("[DEBUG-HISTORY] Flattened Fixes:", flattenedFixes);
        
        if (flattenedFixes.length === 0) {
            toast.warn("No specific fixes found for this resume/JD combination.");
        } else {
            toast.success(`Generated ${flattenedFixes.length} improved suggestions!`);
        }
        
        setAuditResults(flattenedFixes);
    } catch (error) {
        console.error("Historical Audit Error:", error);
        toast.error("Failed to generate historical fixes");
        setAuditResults([]);
    } finally {
        setIsAuditing(false);
    }
  };

  const generateTailoredSummary = async () => {
    if (!atsJd || !resumeData) return;
    setIsGeneratingSummary(true);
    try {
        const resumeText = JSON.stringify(resumeData.content);
        const res = await atsAPI.getTailoredSummary({ resumeText, jobDescription: atsJd });
        
        // Update the Local State
        const newData = { ...resumeData };
        // res.data.data contains the string result from orchestrator { success: true, data: "..." }
        const summaryText = res.data.data.data || res.data.data;

        if (summaryText) {
            newData.content.personalInfo.summary = summaryText;
            setResumeData(newData);
            toast.success("Tailored summary generated!");
            setActiveSection('personal'); 
        } else {
            throw new Error("Empty summary received");
        }
        } catch (error) {
            toast.error("Failed to generate summary.");
        } finally {
            setIsGeneratingSummary(false);
        }
    };

    const fetchSmartSkills = async () => {
        if (!atsJd || !resumeData) return;
        setIsFetchingSmartSkills(true);
        try {
            const res = await atsAPI.getSmartSkills({ 
                skills: resumeData.content.skills, 
                jobDescription: atsJd 
            });
            // Standardized backend now returns the object directly in res.data.data
            // We'll support both patterns for robustness
            const skillData = res.data.data?.missing_skills ? res.data.data : res.data.data?.data;
            setSmartSkills(skillData || res.data.data);
            toast.success("Smart skill analysis complete!");
        } catch (error) {
            toast.error("Failed to fetch smart skills.");
        } finally {
            setIsFetchingSmartSkills(false);
        }
    };

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
      if (data.latexCode) updatePdfPreview(data.latexCode, data.lastRenderedHash);
    } catch (error) {
      // Failed to load resume
    } finally {
      setLoading(false);
    }
  };

  const updatePdfPreview = async (latexCode, hash = null) => {
    if (!latexCode) return;
    setCompiling(true);
    try {
        const response = await compilerAPI.compile(latexCode, hash);
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

  const handleSave = async (newData = resumeData, options = {}) => {
    setSaving(true);
    try {
      const payload = { 
        updatedContent: newData.content,
        ...options
      };
      const res = await resumeAPI.update(id, payload);
      setResumeData(prev => ({ ...prev, ...res.data })); 
      if (res.data.latexCode) await updatePdfPreview(res.data.latexCode, res.data.lastRenderedHash);
    } catch (error) {
      alert("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const toggleCompactMode = async () => {
    const nextMode = !resumeData.compactMode;

    // IF TURNING ON: Offer AI Compaction
    if (nextMode) {
        const wantsAI = window.confirm(
            "AI COMPACTION SERVICE\n\nWould you like AI to aggressively rewrite your Experience & Projects to fit exactly one page?\n\n- Bullet points will be reduced to 3 per role.\n- Every point will be rewritten to 1 line.\n- THIS IS A ONE-WAY TRANSFORMATION.\n\nClick 'OK' to Rewrite with AI, or 'Cancel' to just use narrow margins."
        );

        if (wantsAI) {
            setIsCompacting(true);
            try {
                const res = await resumeAPI.compactAI(id, { resumeData: resumeData.content });
                if (res.data.success) {
                    setResumeData(prev => ({ 
                        ...prev, 
                        content: res.data.content, 
                        compactMode: true,
                        latexCode: res.data.latexCode 
                    }));
                    if (res.data.latexCode) {
                        updatePdfPreview(res.data.latexCode, res.data.lastRenderedHash);
                    }
                    toast.success("AI Compaction Applied Successfully!");
                    return; // Exit early
                }
            } catch (err) {
                toast.error("AI Compaction failed. Falling back to layout only.");
            } finally {
                setIsCompacting(false);
            }
        }
    }

    // Standard Toggle Logic (Layout Only)
    setResumeData(prev => ({ ...prev, compactMode: nextMode }));
    await handleSave(resumeData, { compactMode: nextMode });
    toast.success(nextMode ? "One-Page Layout Enabled" : "Standard Layout Restored");
  };

  // download the resume
  const handleDownload = () => {
    if (!pdfUrl) {
        toast.error("No PDF generated yet to download.");
        return;
    }

    // Create a temporary link element
    const link = document.createElement('a');
    link.href = pdfUrl;
    
    // Set filename (use the version name or a default)
    const fileName = resumeData?.versionName 
        ? `${resumeData.versionName.replace(/\s+/g, '_')}.pdf` 
        : "resume.pdf";
        
    link.download = fileName;
    
    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Download started!");
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
          if (content[section][index]) {
            content[section][index][field] = value;
          }
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
    
    // Set clinical name from first line or default
    const firstLine = atsJd.split('\n')[0].trim().substring(0, 40);
    setSelectedScanTitle(firstLine || "Job Description Scan");

    try {
        const pdfResponse = await fetch(pdfUrl);
        const pdfBlob = await pdfResponse.blob();
        const formData = new FormData();
        formData.append('resume', new File([pdfBlob], "resume.pdf", { type: "application/pdf" }));
        formData.append('jd', atsJd);
        formData.append('resumeId', id); // Pass current version ID for history tracking
        
        const res = await atsAPI.analyze(formData);
        const result = res.data.data; // Backend standardized to { success, data }
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
            atsImprovements: atsResult?.improvements || [],
            compactMode: resumeData.compactMode === true
        };

        const res = await resumeAPI.audit(payload);
        console.log("[DEBUG] Audit Raw Response:", res.data); // CRITICAL DEBUG 1
        
        // Handle standardized format where report is in res.data or res.data.report
        const reportData = res.data.data?.report || res.data.report || res.data.data || res.data; 
        console.log("[DEBUG] Extracted Report Data:", reportData); // CRITICAL DEBUG 2
        
        const flattenedFixes = flattenAuditReport(reportData);
        console.log("[DEBUG] Flattened Fixes:", flattenedFixes); // CRITICAL DEBUG 3
        
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

    if (report.summary && report.summary.suggestion && report.summary.suggestion !== report.summary.original) {
        fixes.push({
            section: 'personal',
            context: 'Professional Summary',
            original: report.summary.original,
            suggestion: report.summary.suggestion,
            reason: report.summary.reason || "High-impact JD keyword alignment",
            subType: 'field',
            fieldName: 'summary'
        });
    }

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
        // Handle both object-audit and array-based skills from AI
        if (Array.isArray(report.skills)) {
            report.skills.forEach(skillFix => {
                if (skillFix.suggestion && skillFix.suggestion !== skillFix.original) {
                    fixes.push({
                        section: 'skills',
                        context: skillFix.fieldName ? skillFix.fieldName.charAt(0).toUpperCase() + skillFix.fieldName.slice(1) : "Skills",
                        original: skillFix.original,
                        suggestion: skillFix.suggestion,
                        reason: skillFix.reason || "Optimized keywords",
                        subType: 'field',
                        fieldName: skillFix.fieldName || 'languages'
                    });
                }
            });
        } else {
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
                            subType: 'field',
                            fieldName: realFieldName
                        });
                    }
                }
            });
        }
    }

    // 2. Handle Line Trade suggestions (remove/merge fluff)
    if (report.lineTrade?.spaceSavingSuggestions) {
        report.lineTrade.spaceSavingSuggestions.forEach(trade => {
            fixes.push({
                section: 'experience',
                context: 'Space Saving Optimization',
                original: trade.original,
                suggestion: trade.replacement || '', 
                reason: trade.reason || "Removing/Merging for 1-page layout",
                subType: 'point',
                isLineTrade: true
            });
        });
    }

    return fixes;
  };

  // APPLIER: Handle All Section Types
  const applyFixToData = async (fix) => {
    const newData = JSON.parse(JSON.stringify(resumeData));
    let applied = false;
    let targetId = null;

    // Handle Summary/Personal
    if (fix.section === 'personal' && fix.fieldName === 'summary') {
        if (newData.content.personalInfo) {
            newData.content.personalInfo.summary = fix.suggestion;
            applied = true;
            targetId = 'personal-summary';
            setActiveSection('personal');
        }
    }
    // Handle Skills
    else if (fix.section === 'skills') {
        const field = fix.fieldName || 'languages'; 
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
                // Improved matching: checking if original matches a substantial part of a bullet point
                const ptIndex = item.points.findIndex(pt => 
                    pt.trim().toLowerCase().includes(fix.original.trim().toLowerCase()) || 
                    fix.original.trim().toLowerCase().includes(pt.trim().toLowerCase())
                );
                
                if (ptIndex !== -1) {
                    item.points[ptIndex] = fix.suggestion;
                    applied = true;
                    targetId = `${fix.section}-${i}-point-${ptIndex}`;
                    // Set active section immediately
                    if (fix.section === 'experience') setActiveSection('experience');
                    if (fix.section === 'projects') setActiveSection('projects');
                    break;
                }
            }
            
            // Sub-case B: Specific Fields
            if (fix.subType === 'field' && fix.fieldName && item[fix.fieldName]) {
                if (item[fix.fieldName].toLowerCase().includes(fix.original.toLowerCase()) || 
                    fix.original.toLowerCase().includes(item[fix.fieldName].toLowerCase())) {
                    item[fix.fieldName] = fix.suggestion;
                    applied = true;
                    targetId = `${fix.section}-${i}-${fix.fieldName}`;
                    if (fix.section === 'education') setActiveSection('education');
                    break;
                }
            }
        }
    }

    if (applied) {
        setResumeData(newData);
        await handleSave(newData);
        
        // --- Visual Feedback ONLY (No Tab Switching) ---
        if (targetId) {
            setHighlightId(targetId);
            
            // Clear highlight after 3 seconds
            setTimeout(() => setHighlightId(null), 3000);
        }

        return targetId; 
    } else {
        // toast.error("Could not find original text. It might have been changed manually.");
        return null;
    }
  };

  const loadPastScan = async (scan) => {
    if (!scan) return;
    setAtsJd(scan.jdText);
    setSelectedScanTitle(scan.jdTitle || "Past Scan");
    setAtsResult(scan);
    
    // Switch to fix tab and trigger generation for this scan
    setActiveTab('fix');
    handleScanSelection(scan);
  };

  const handleRecalculate = async (targetScan = atsResult) => {
    // Determine the JD text to use
    const jdText = targetScan?.jdText || atsJd;
    
    if (!jdText) {
        toast.error("No job description found to analyze");
        return;
    }

    setCalculatingId(targetScan?._id);
    setAnalyzing(true);
    
    try {
        const pdfResponse = await fetch(pdfUrl);
        const pdfBlob = await pdfResponse.blob();
        const formData = new FormData();
        formData.append('resume', new File([pdfBlob], "resume.pdf", { type: "application/pdf" }));
        formData.append('jd', jdText);
        formData.append('resumeId', id);
        
        const res = await atsAPI.analyze(formData, true); // Pass true to trigger recalculate (bypass cache)
        const newResult = res.data.data;
        
        // Update local state if this is currently viewed
        if (!targetScan || atsResult?._id === targetScan._id || !atsResult) {
            setAtsResult(newResult);
        }

        // --- ALWAYS Open Modal to show new results ---
        setShowAtsModal(true);

        toast.success("Score Updated!");
    } catch (err) {
        console.error("Recalculate error:", err);
        toast.error("Recalculate failed");
    } finally {
        setCalculatingId(null);
        setAnalyzing(false);
    }
  };

  const handleQuickRecalculate = async (scan) => {
    await handleRecalculate(scan);
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-[#00c29f]" size={40}/></div>;

  const SectionHeader = ({ title, id, isOpen, onClick }) => (
      <button onClick={onClick} className={`w-full flex items-center justify-between p-4 font-bold text-gray-800 border-b border-gray-100 hover:bg-gray-50 transition-colors ${isOpen ? 'bg-gray-50' : ''}`}>
          {title}
          {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>
  );

  const MatchGapBarSmall = ({ label, percentage, color }) => (
    <div className="space-y-1">
      <div className="flex justify-between text-[9px] font-bold uppercase text-gray-400">
        <span>{label}</span>
        <span>{percentage}%</span>
      </div>
      <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-1000 ${color}`} 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
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
            <div className="flex items-center bg-gray-100 rounded-lg p-1 mr-2">
                <button 
                    onClick={handleUndo} 
                    disabled={undoStack.length === 0}
                    className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-white rounded-md disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                    title="Undo (Ctrl+Z)"
                >
                    <ArrowLeft size={16} />
                </button>
                <button 
                    onClick={handleRedo} 
                    disabled={redoStack.length === 0}
                    className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-white rounded-md disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                    title="Redo (Ctrl+Y)"
                >
                    <ArrowLeft size={16} className="rotate-180" />
                </button>
            </div>
            <Button 
                variant="outline" 
                onClick={toggleCompactMode} 
                loading={isCompacting}
                className={`h-9 px-4 transition-all duration-300 ${resumeData?.compactMode ? 'bg-orange-50 border-orange-200 text-orange-600 font-bold shadow-sm ring-1 ring-orange-200' : 'text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                title={resumeData?.compactMode ? "Disable Layout Compaction" : "AI One-Page Compaction"}
            >
                <RefreshCw size={16} className={`mr-2 ${resumeData?.compactMode ? 'animate-pulse text-orange-500' : 'text-gray-400'}`} /> 
                {resumeData?.compactMode ? "Compact Mode ON" : "Compact Mode"}
            </Button>
            <Button 
                variant="outline" 
                onClick={() => setShowCoverLetter(true)} 
                className="h-9 px-4 text-gray-700 border-gray-300 hover:bg-gray-50"
            >
                <FileText size={16} className="mr-2 text-purple-600" /> Cover Letter
            </Button>
            <Button variant="outline" onClick={() => setShowAtsModal(true)} className="h-9 px-4 border-indigo-200 text-indigo-600 hover:bg-indigo-50"><Target size={16} className="mr-2" /> Target Match</Button>
            <Button variant="ghost" onClick={() => handleSave()} disabled={saving} className="h-9 px-4 text-gray-600">{saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} className="mr-2" />} Save</Button>
            <Button onClick={handleDownload} disabled={!pdfUrl || compiling} className="h-9 px-4"><Download size={18} className="mr-2" /> Download</Button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Left Panel: Editor & Fixes */}
        <div className="w-1/2 flex flex-col border-r border-gray-200 bg-white">
            <div className="flex border-b border-gray-200">
                <button onClick={() => setActiveTab('manual')} className={`flex-1 py-4 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${activeTab === 'manual' ? 'text-[#00c29f] border-b-2 border-[#00c29f] bg-teal-50/50' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`}><Edit3 size={14} /> Manual</button>
                <button onClick={() => { if(auditResults.length > 0) setActiveTab('fix'); else toast.error("Run a scan first!"); }} className={`flex-1 py-4 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${activeTab === 'fix' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`}><Wand2 size={14} /> AI Fixes</button>
                <button onClick={() => setActiveTab('history')} className={`flex-1 py-4 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${activeTab === 'history' ? 'text-amber-500 border-b-2 border-amber-500 bg-amber-50/50' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`}><History size={14} /> History</button>
            </div>

            <div className="flex-1 overflow-y-auto pb-4 custom-scrollbar p-1">
                {activeTab === 'fix' ? (
                    <FixListPanel 
                        auditReport={auditResults} 
                        activeJdTitle={selectedScanTitle}
                        lineTrade={lineTradeInfo}
                        onApplyFix={async (fix) => {
                            return await applyFixToData(fix);
                        }} 
                        onRecalculate={() => handleRecalculate()}
                        loading={saving || isAuditing} 
                        recalculating={analyzing}
                    />
                ) : activeTab === 'history' ? (
                  <div className="p-4 space-y-4">
                    <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-700 leading-relaxed">
                        <b>💡 Tip:</b> Click <b>"View AI Fixes"</b> to load suggestions into the Fixes tab. You can re-run a scan by clicking the <b>Refresh</b> icon.
                    </div>
                    <ScanHistory 
                        resumeId={id} 
                        calculatingId={calculatingId}
                        onRecalculate={handleQuickRecalculate}
                        onGoToFix={(scan) => {
                            loadPastScan(scan);
                            setActiveTab('fix');
                        }}
                        onSelectScan={(scan) => {
                            loadPastScan(scan);
                        }}
                    />
                  </div>
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
                                    <div className="pt-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Professional Summary</label>
                                        <TextArea 
                                            placeholder="A highly skilled software engineer..." 
                                            value={resumeData.content.personalInfo.summary || ''} 
                                            onChange={e => handlePersonalInfoChange('summary', e.target.value)} 
                                            className="min-h-[120px] text-sm"
                                        />
                                        <p className="text-[10px] text-gray-400 mt-1 uppercase font-medium">Tip: Use clinical keywords for higher ATS matching</p>
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
                                                <Input 
                                                    id={`experience-${index}-company`}
                                                    label="Company" 
                                                    value={exp.company} 
                                                    onChange={e => handleArrayChange('experience', index, 'company', e.target.value)} 
                                                    className={highlightId === `experience-${index}-company` ? 'animate-flash' : ''}
                                                />
                                                <Input 
                                                    id={`experience-${index}-role`}
                                                    label="Role" 
                                                    value={exp.role} 
                                                    onChange={e => handleArrayChange('experience', index, 'role', e.target.value)} 
                                                    className={highlightId === `experience-${index}-role` ? 'animate-flash' : ''}
                                                />
                                                <Input 
                                                    id={`experience-${index}-duration`}
                                                    label="Duration" 
                                                    value={exp.duration} 
                                                    onChange={e => handleArrayChange('experience', index, 'duration', e.target.value)} 
                                                    className={highlightId === `experience-${index}-duration` ? 'animate-flash' : ''}
                                                />
                                                <Input 
                                                    id={`experience-${index}-location`}
                                                    label="Location" 
                                                    value={exp.location} 
                                                    onChange={e => handleArrayChange('experience', index, 'location', e.target.value)} 
                                                    className={highlightId === `experience-${index}-location` ? 'animate-flash' : ''}
                                                />
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
                                                <Input 
                                                    id={`projects-${index}-title`}
                                                    label="Title" 
                                                    value={proj.title} 
                                                    onChange={e => handleArrayChange('projects', index, 'title', e.target.value)} 
                                                    className={highlightId === `projects-${index}-title` ? 'animate-flash' : ''}
                                                />
                                                <Input 
                                                    id={`projects-${index}-tech`}
                                                    label="Tech Stack" 
                                                    value={proj.tech} 
                                                    onChange={e => handleArrayChange('projects', index, 'tech', e.target.value)} 
                                                    className={highlightId === `projects-${index}-tech` ? 'animate-flash' : ''}
                                                />
                                                <Input 
                                                    id={`projects-${index}-link`}
                                                    label="Link" 
                                                    value={proj.link} 
                                                    onChange={e => handleArrayChange('projects', index, 'link', e.target.value)} 
                                                    className={highlightId === `projects-${index}-link` ? 'animate-flash' : ''}
                                                />
                                                <Input 
                                                    id={`projects-${index}-date`}
                                                    label="Date" 
                                                    value={proj.date} 
                                                    onChange={e => handleArrayChange('projects', index, 'date', e.target.value)} 
                                                    className={highlightId === `projects-${index}-date` ? 'animate-flash' : ''}
                                                />
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
                                        <Input id="skills-additional_skills" className={highlightId === 'skills-additional_skills' ? 'animate-flash' : ''} label="Additional Skills (Agile, Scrum, etc.)" value={resumeData.content.skills.additional_skills} onChange={e => handleSkillChange('additional_skills', e.target.value)} />
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

        {/* Right Panel: Preview/Code */}
        <div className="w-1/2 bg-gray-100 flex flex-col relative border-l border-gray-200">
             {/* Toggle Bar */}
             <div className="bg-white border-b border-gray-200 px-4 h-12 flex items-center justify-between">
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button 
                        onClick={() => setPreviewMode('pdf')}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${previewMode === 'pdf' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        PDF Preview
                    </button>
                    <button 
                        onClick={() => setPreviewMode('latex')}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${previewMode === 'latex' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        LaTeX Code
                    </button>
                </div>
                {previewMode === 'latex' && (
                    <button 
                        onClick={() => {
                            navigator.clipboard.writeText(resumeData.latexCode);
                            toast.success("LaTeX code copied!");
                        }}
                        className="text-gray-500 hover:text-indigo-600 transition-colors p-1.5"
                        title="Copy Code"
                    >
                        <Copy size={16} />
                    </button>
                )}
             </div>

             {compiling && <div className="absolute inset-0 top-12 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center"><Loader2 className="animate-spin text-[#00c29f]"/></div>}
             
             <div className="flex-1 overflow-hidden h-full relative">
                {previewMode === 'pdf' ? (
                    <div className="p-8 h-full">
                       {pdfUrl ? <iframe src={`${pdfUrl}#toolbar=0&navpanes=0`} className="w-full h-full rounded-lg shadow-2xl border border-gray-200" title="Resume Preview"/> : <div className="w-full h-full flex items-center justify-center text-gray-400">Generating Preview...</div>}
                    </div>
                ) : (
                    <div className="h-full bg-gray-900 p-6 font-mono text-sm overflow-y-auto custom-scrollbar">
                        <pre className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                            {resumeData.latexCode || "% No LaTeX code generated yet.\n% Save changes to generate code."}
                        </pre>
                    </div>
                )}
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
                            
                            {/* Match Gap Analysis Visualization */}
                            <div className="grid grid-cols-2 gap-4">
                                <MatchGapBarSmall label="Skills" percentage={atsResult.match_gap?.skills || 0} color="bg-blue-500" />
                                <MatchGapBarSmall label="Exp" percentage={atsResult.match_gap?.experience || 0} color="bg-purple-500" />
                                <MatchGapBarSmall label="Edu" percentage={atsResult.match_gap?.education || 0} color="bg-emerald-500" />
                                <MatchGapBarSmall label="Culture" percentage={atsResult.match_gap?.culture || 0} color="bg-orange-500" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-green-50 rounded-xl border border-green-100"><h4 className="font-bold text-green-700 mb-2">Strengths</h4><ul className="list-disc list-inside text-sm text-gray-600 space-y-1">{atsResult.strengths?.map((s,i)=><li key={i}>{s}</li>)}</ul></div>
                                <div className="p-4 bg-orange-50 rounded-xl border border-orange-100"><h4 className="font-bold text-orange-700 mb-2">Improvements</h4><ul className="list-disc list-inside text-sm text-gray-600 space-y-1">{atsResult.improvements?.map((s,i)=><li key={i}>{s}</li>)}</ul></div>
                            </div>
                            
                            {/* Tailored Summary Button */}
                            <div className="bg-purple-50 border border-purple-100 p-4 rounded-xl flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
                                        <Wand2 size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-purple-900 text-sm">Tailored Professional Summary</h4>
                                        <p className="text-xs text-purple-600">Rewrite your summary to match this JD perfectly.</p>
                                    </div>
                                </div>
                                <Button 
                                    size="sm" 
                                    onClick={generateTailoredSummary} 
                                    loading={isGeneratingSummary}
                                    className="bg-purple-600 hover:bg-purple-700 text-white"
                                >
                                    Generate
                                </Button>
                            </div>

                            {/* Smart Skills Extension */}
                            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                            <Edit3 size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-blue-900 text-sm">Smart Skill Gap</h4>
                                            <p className="text-xs text-blue-600">Extract critical skills missing from your resume.</p>
                                        </div>
                                    </div>
                                    <Button 
                                        size="sm" 
                                        variant="outline" 
                                        onClick={fetchSmartSkills} 
                                        loading={isFetchingSmartSkills}
                                        className="border-blue-200 text-blue-600 hover:bg-blue-100"
                                    >
                                        Analyze Gap
                                    </Button>
                                </div>

                                {smartSkills && (
                                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                        <div className="flex flex-wrap gap-2">
                                            {smartSkills.top_keywords?.slice(0, 10).map((kw, i) => (
                                                <span key={i} className="px-2 py-1 bg-white text-blue-700 text-[10px] font-bold rounded-lg border border-blue-100 uppercase">
                                                    {kw}
                                                </span>
                                            ))}
                                        </div>
                                        <div className="space-y-2">
                                            {smartSkills.missing_skills?.map((s, i) => (
                                                <div key={i} className={`p-2 rounded-lg text-xs flex items-start gap-2 ${s.category === 'primary' ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-600'}`}>
                                                    <span className="font-bold whitespace-nowrap">[{s.category}]</span>
                                                    <div>
                                                        <span className="font-bold">{s.name}</span>: {s.reason}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                    {!atsResult ? (
                        <Button onClick={runAtsCheck} loading={analyzing} disabled={!atsJd}>Run Analysis</Button>
                    ) : (
                        <> 
                            <Button 
                                variant="outline" 
                                onClick={runAtsCheck} 
                                loading={analyzing}
                                className="border-blue-200 text-blue-700 hover:bg-blue-50"
                            >
                                <RefreshCw size={14} className={`mr-2 ${analyzing ? 'animate-spin' : ''}`} />
                                Re-Calculate Score
                            </Button>
                            <Button variant="outline" onClick={() => { setAtsResult(null); setAtsJd(''); setSmartSkills(null); }}>Check Another</Button> 
                            <Button onClick={enableFixMode} className="bg-indigo-600 hover:bg-indigo-700"><Wand2 size={16} className="mr-2" /> Fix Resume</Button> 
                        </>
                    )}
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