import MasterProfile from '../models/MasterProfile.js';
import ResumeVersion from '../models/ResumeVersion.js';
import { generateLatexString } from '../services/latexService.js';
import { generateComprehensiveAudit, generateCoverLetter } from '../services/aiService.js';

// =========================================================
// HELPER FUNCTIONS
// =========================================================

// ✅ HELPER 1: Case-insensitive key reader
// Reads obj.key, obj.KEY, or obj.Key safely
const getValue = (obj, key) => {
  if (!obj) return "";
  return obj[key] || obj[key.toUpperCase()] || obj[key.toLowerCase()] || "";
};

const normalizeResumeData = (rawData, userId) => {
  if (!rawData) return {}; 

  const getNested = (parent, key) => parent ? getValue(parent, key) : "";

  // ✅ FIXED: Robust mapper for Certs/Achievements
  const mapItemWithLink = (items) => {
    if (!items || !Array.isArray(items)) return [];
    
    return items.map(item => {
      // CASE 1: It's already an object { name, link }
      if (typeof item === 'object' && item !== null) {
         return {
           name: item.name || item.NAME || "",
           link: item.link || item.LINK || ""
         };
      }
      // CASE 2: It's a legacy string "Cert Name"
      if (typeof item === 'string') {
         return { name: item, link: "" };
      }
      return { name: "", link: "" };
    });
  };

  return {
    userId, 
    
    personalInfo: {
      name: getNested(rawData, 'NAME') || getNested(rawData.personalInfo, 'name'),
      email: getNested(rawData, 'EMAIL') || getNested(rawData.personalInfo, 'email'),
      phone: getNested(rawData, 'PHONE') || getNested(rawData.personalInfo, 'phone'),
      linkedin: getNested(rawData, 'LINKEDIN') || getNested(rawData.personalInfo, 'linkedin'),
      github: getNested(rawData, 'GITHUB') || getNested(rawData.personalInfo, 'github'),
      location: getNested(rawData, 'LOCATION') || getNested(rawData.personalInfo, 'location'),
      portfolio: getNested(rawData, 'PORTFOLIO') || getNested(rawData.personalInfo, 'portfolio')
    },
    
    experience: (rawData.EXPERIENCE || rawData.experience || []).map(e => ({
      company: getValue(e, 'company'), 
      role: getValue(e, 'role'),
      duration: getValue(e, 'duration'),
      location: getValue(e, 'location'),
      points: e.points || e.POINTS || []
    })),

    projects: (rawData.PROJECTS || rawData.projects || []).map(p => ({
      title: getValue(p, 'title'),
      link: getValue(p, 'link'),
      tech: getValue(p, 'tech'),
      date: getValue(p, 'date'),
      points: p.points || p.POINTS || []
    })),

    education: (rawData.EDUCATION || rawData.education || []).map(ed => ({
      institute: getValue(ed, 'institute'),
      duration: getValue(ed, 'duration'),
      details: getValue(ed, 'details')
    })),

    skills: {
      languages: getNested(rawData.SKILLS || rawData.skills, 'languages'),
      frameworks: getNested(rawData.SKILLS || rawData.skills, 'frameworks'),
      tools: getNested(rawData.SKILLS || rawData.skills, 'tools'),
      databases: getNested(rawData.SKILLS || rawData.skills, 'databases'),
      core_concepts: getNested(rawData.SKILLS || rawData.skills, 'core_concepts'),
      soft_skills: getNested(rawData.SKILLS || rawData.skills, 'soft_skills'),
    },

    // ✅ APPLY THE FIX HERE
    certifications: mapItemWithLink(rawData.CERTIFICATIONS || rawData.certifications),
    achievements: mapItemWithLink(rawData.ACHIEVEMENTS || rawData.achievements)
  };
};

// =========================================================
// CONTROLLER FUNCTIONS
// =========================================================
export const createProfile = async (req, res) => {
  try {
    let userId = req.headers['x-user-id'];
    if (!userId && req.body.userId) userId = req.body.userId;

    if (!userId) return res.status(401).json({ error: "Unauthorized request" });

    const rawData = req.body.userData || req.body; 
    
    // Custom Title logic
    const customTitle = req.body.versionName || req.body.title || `Resume - ${new Date().toLocaleDateString()}`;

    // Normalize Data
    const masterData = normalizeResumeData(rawData, userId);

    // --- 🛑 CHANGED LOGIC START 🛑 ---
    
    // 1. Check if Master Profile exists
    let masterProfile = await MasterProfile.findOne({ userId });

    // 2. Only create/update Master if it doesn't exist OR if explicitly requested
    const shouldUpdateMaster = req.body.updateMaster === true;

    if (!masterProfile || shouldUpdateMaster) {
      // Upsert logic
      masterProfile = await MasterProfile.findOneAndUpdate(
        { userId }, 
        masterData, 
        { new: true, upsert: true }
      );
    }
    
    // --- 🛑 CHANGED LOGIC END 🛑 ---

    // 3. Create Resume Snapshot (Always uses the incoming data, not necessarily Master)
    // We use 'masterData' here because it's the normalized version of what the user sent
    const initialContent = { ...masterData };
    delete initialContent.userId; 

    // Generate LaTeX
    const latexCode = generateLatexString({ content: initialContent });

    const newVersion = new ResumeVersion({
      userId,
      masterProfileId: masterProfile._id, // Link to master, even if we didn't update it
      versionName: customTitle,
      content: initialContent,
      latexCode: latexCode
    });

    await newVersion.save();

    res.status(201).json({
      success: true,
      message: "Resume Created Successfully",
      masterId: masterProfile._id,
      resumeId: newVersion._id,
      latexCode, 
      content: initialContent 
    });

  } catch (error) {
    console.error("Create Profile Error:", error);
    res.status(500).json({ error: error.message });
  }
};

// 2. Audit Resume (AI)
export const auditResume = async (req, res) => {
  try {
    // ✅ Extract atsImprovements from request body
    const { resumeData, jobDescription, atsImprovements } = req.body;
    // ✅ Pass it to the service
    const auditReport = await generateComprehensiveAudit(
        resumeData, 
        jobDescription, 
        atsImprovements || [] // Default to empty array if not provided
    );
    res.json({ success: true, report: auditReport });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};



// 3. Update Resume (Saving Edits OR ATS Score)
export const updateResumeVersion = async (req, res) => {
  try {
    const { id } = req.params; 
    const { updatedContent, atsScore, atsAnalysis, jobDescription } = req.body; 

    const resume = await ResumeVersion.findById(id);
    if (!resume) return res.status(404).json({ error: "Resume not found" });

    // ✅ CHECK 1: Do we have content to update?
    if (updatedContent && Object.keys(updatedContent).length > 0) {
      // Normalize the incoming data to match Schema structure
      const cleanContent = normalizeResumeData(updatedContent, null);
      delete cleanContent.userId; 
      
      resume.content = cleanContent;
      
      // Regenerate LaTeX
      const newLatex = generateLatexString(resume);
      resume.latexCode = newLatex;
    }

    // ✅ CHECK 2: Do we have ATS Data to update?
    if (atsScore !== undefined) resume.atsScore = atsScore;
    if (atsAnalysis !== undefined) resume.atsAnalysis = atsAnalysis;
    if (jobDescription !== undefined) resume.jobDescription = jobDescription;

    await resume.save();

    res.json({ 
      success: true, 
      message: "Resume updated", 
      latexCode: resume.latexCode,
      content: resume.content,
      atsScore: resume.atsScore
    });
  } catch (error) {
    console.error("Update Error:", error);
    res.status(500).json({ error: "Update failed", details: error.message });
  }
};

// 4. Get Resume LaTeX
export const getResumeLatex = async (req, res) => {
  try {
    const { id } = req.params;
    const resume = await ResumeVersion.findById(id);
    if (!resume) return res.status(404).json({ error: "Resume not found" });
    res.send(resume.latexCode);
  } catch (error) {
    res.status(500).json({ error: "Fetch failed" });
  }
};

// 5. Get User Resumes (Dashboard List)
export const getUserResumes = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const resumes = await ResumeVersion.find({ userId })
      .select('versionName jobDescription atsScore updatedAt createdAt') 
      .sort({ updatedAt: -1 }); 
    res.json({ success: true, count: resumes.length, data: resumes });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch history" });
  }
};

// 6. Get Resume By ID (Editor Load)
export const getResumeById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers['x-user-id'];
    const resume = await ResumeVersion.findOne({ _id: id, userId });
    if (!resume) return res.status(404).json({ error: "Resume not found" });
    res.json({ success: true, data: resume });
  } catch (error) {
    res.status(500).json({ error: "Fetch failed" });
  }
};

// 7. Get Master Profile
export const getMasterProfile = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const profile = await MasterProfile.findOne({ userId });
    if (!profile) return res.status(404).json({ error: "Profile not found" });
    res.json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ error: "Fetch failed" });
  }
};

// 8. Update Master Profile
export const updateMasterProfile = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const { userData } = req.body; 
    
    // ✅ NORMALIZE HERE TOO
    const masterData = normalizeResumeData(userData, userId);

    const updatedProfile = await MasterProfile.findOneAndUpdate(
      { userId },
      { $set: masterData },
      { new: true } 
    );
    res.json({ success: true, message: "Profile updated", data: updatedProfile });
  } catch (error) {
    res.status(500).json({ error: "Update failed" });
  }
};

// 9. Delete Resume
export const deleteResume = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers['x-user-id'];
    const result = await ResumeVersion.findOneAndDelete({ _id: id, userId });
    if (!result) return res.status(404).json({ error: "Resume not found" });
    res.json({ success: true, message: "Resume deleted" });
  } catch (error) {
    res.status(500).json({ error: "Delete failed" });
  }
};

// 10. Wipe Data
export const wipeUserData = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    await Promise.all([
      MasterProfile.findOneAndDelete({ userId }),
      ResumeVersion.deleteMany({ userId })
    ]);
    res.json({ success: true, message: "All user data deleted" });
  } catch (error) {
    res.status(500).json({ error: "Wipe failed" });
  }
};

// POST /api/resume/cover-letter
export const createCoverLetter = async (req, res) => {
  try {
    const { resumeData, jobDescription } = req.body;

    if (!resumeData || !jobDescription) {
        return res.status(400).json({ error: "Missing resume data or job description" });
    }

    const letter = await generateCoverLetter(resumeData, jobDescription);

    res.json({ 
        success: true, 
        coverLetter: letter 
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};