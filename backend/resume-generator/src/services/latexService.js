import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper: Escape special LaTeX characters
const escapeLatex = (str) => {
  if (!str) return "";
  return String(str)
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/&/g, '\\&')
    .replace(/%/g, '\\%')
    .replace(/\$/g, '\\$')
    .replace(/#/g, '\\#')
    .replace(/_/g, '\\_')
    .replace(/{/g, '\\{')
    .replace(/}/g, '\\}')
    .replace(/\^/g, '\\textasciicircum{}')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/[\r\n]+/g, " "); // Flatten newlines
};

export const generateLatexString = (data) => {
  const templatePath = path.join(__dirname, '../templates/template.tex');
  let template = fs.readFileSync(templatePath, 'utf8');
  const content = data.content || {}; 

  let fullLatex = "";

  // ---------------------------------------------------------
  // 1. HEADER (Safe Construction)
  // ---------------------------------------------------------
  const p = content.personalInfo || {};
  const name = p.name || "Your Name";
  
  fullLatex += `%----------HEADING----------\n`;
  fullLatex += `\\begin{center}\n`;
  fullLatex += `    {\\Huge \\scshape ${escapeLatex(name)}} \\\\ \\vspace{1pt}\n`;
  
  if (p.location) {
    fullLatex += `    ${escapeLatex(p.location)} \\\\ \\vspace{1pt}\n`;
  }

  // Contact Info Line
  let contactParts = [];
  if (p.phone) contactParts.push(`\\small \\underline{\\href{tel:${p.phone}}{${escapeLatex(p.phone)}}}`);
  if (p.email) contactParts.push(`\\underline{\\href{mailto:${p.email}}{${escapeLatex(p.email)}}}`);
  if (p.linkedin) contactParts.push(`\\underline{\\href{${p.linkedin}}{LinkedIn}}`);
  if (p.github) contactParts.push(`\\underline{\\href{${p.github}}{GitHub}}`);
  if (p.portfolio) contactParts.push(`\\underline{\\href{${p.portfolio}}{Portfolio}}`);

  if (contactParts.length > 0) {
    fullLatex += `    ${contactParts.join(" ~ ")}\n`;
  }
  
  fullLatex += `\\end{center}\n\\vspace{-4pt}\n\n`;

  // ---------------------------------------------------------
  // 2. PROJECTS (Conditional)
  // ---------------------------------------------------------
  const projects = (content.projects || []).filter(p => p.title && p.title.trim().length > 0);
  
  if (projects.length > 0) {
    fullLatex += `%-----------PROJECTS-----------\n`;
    fullLatex += `\\section{PROJECTS}\n`;
    fullLatex += `\\resumeSubHeadingListStart\n`;

    projects.forEach(proj => {
      const linkCmd = proj.link 
        ? `\\href{${proj.link}}{\\underline{\\textbf{\\large{${escapeLatex(proj.title)}}}}}`
        : `\\underline{\\textbf{\\large{${escapeLatex(proj.title)}}}}`;

      fullLatex += `\\resumeProjectHeading\n`;
      fullLatex += `  {${linkCmd} $|$ \\large{${escapeLatex(proj.tech)}}}{${escapeLatex(proj.date)}}\n`;

      const validPoints = (proj.points || []).filter(pt => pt && pt.trim().length > 0);
      if (validPoints.length > 0) {
        fullLatex += `  \\resumeItemListStart\n`;
        validPoints.forEach(pt => {
          fullLatex += `    \\resumeItem{${escapeLatex(pt)}}\n`;
        });
        fullLatex += `  \\resumeItemListEnd\n`;
      }
      fullLatex += `\\vspace{-1pt}\n`;
    });

    fullLatex += `\\resumeSubHeadingListEnd\n\n`;
  }

  // ---------------------------------------------------------
  // 3. EXPERIENCE (Conditional)
  // ---------------------------------------------------------
  const experience = (content.experience || []).filter(e => e.company && e.company.trim().length > 0);

  if (experience.length > 0) {
    fullLatex += `%-----------EXPERIENCE-----------\n`;
    fullLatex += `\\section{EXPERIENCE}\n`;
    fullLatex += `\\resumeSubHeadingListStart\n`;

    experience.forEach(exp => {
      const header = `\\textbf{${escapeLatex(exp.role)}} -- ${escapeLatex(exp.company)}`;
      fullLatex += `\\resumeSubheading\n`;
      fullLatex += `  {${header}}{${escapeLatex(exp.duration)}}\n`;

      const validPoints = (exp.points || []).filter(pt => pt && pt.trim().length > 0);
      if (validPoints.length > 0) {
        fullLatex += `  \\resumeItemListStart\n`;
        validPoints.forEach(pt => {
          fullLatex += `    \\resumeItem{${escapeLatex(pt)}}\n`;
        });
        fullLatex += `  \\resumeItemListEnd\n`;
      }
    });

    fullLatex += `\\resumeSubHeadingListEnd\n\n`;
  }

  // ---------------------------------------------------------
  // 4. SKILLS (Conditional)
  // ---------------------------------------------------------
  const s = content.skills || {};
  let skillLines = [];

  const addSkillLine = (label, val) => {
    const valStr = Array.isArray(val) ? val.filter(Boolean).join(", ") : val;
    if (valStr && valStr.trim().length > 0) {
      skillLines.push(`\\resumeItem{\\textbf{${label}:} ${escapeLatex(valStr)}}`);
    }
  };

  addSkillLine("Languages", s.languages);
  addSkillLine("Frameworks/Libraries", s.frameworks);
  addSkillLine("Tools", s.tools);
  addSkillLine("Databases", s.databases);
  addSkillLine("Core Concepts", s.core_concepts);

  if (skillLines.length > 0) {
    fullLatex += `%-----------SKILLS-----------\n`;
    fullLatex += `\\section{SKILLS \\& TECHNOLOGIES}\n`;
    fullLatex += `\\resumeItemListStart\n`;
    skillLines.forEach(line => fullLatex += `${line}\n`);
    fullLatex += `\\resumeItemListEnd\n\n`;
  }

  // ---------------------------------------------------------
  // 5. CERTIFICATIONS (Conditional)
  // ---------------------------------------------------------
  const certs = (content.certifications || []).filter(c => c.name && c.name.trim().length > 0);
  
  if (certs.length > 0) {
    fullLatex += `%-----------CERTIFICATIONS-----------\n`;
    fullLatex += `\\section{CERTIFICATIONS}\n`;
    fullLatex += `\\begin{itemize}[leftmargin=0in,label={}]\n`;
    fullLatex += `\\item\n`;
    fullLatex += `\\begin{itemize}\n`;
    certs.forEach(c => {
      // Logic: if link exists, wrap name with \href
      const text = c.link 
        ? `\\href{${c.link}}{${escapeLatex(c.name)}}` 
        : escapeLatex(c.name);
        
      fullLatex += `\\item \\small ${text}\n`;
      // fullLatex += `\\item \\small ${escapeLatex(c)}\n`;
    });
    fullLatex += `\\end{itemize}\n`;
    fullLatex += `\\end{itemize}\n\n`;
  }

  // ---------------------------------------------------------
  // 6. ACHIEVEMENTS (Conditional)
  // ---------------------------------------------------------
  const achs = (content.achievements || []).filter(a => a.name && a.name.trim().length > 0);

  if (achs.length > 0) {
    fullLatex += `%-----------ACHIEVEMENTS-----------\n`;
    fullLatex += `\\section{ACHIEVEMENTS}\n`;
    fullLatex += `\\begin{itemize}[leftmargin=0in,label={}]\n`;
    fullLatex += `\\item\n`;
    fullLatex += `\\begin{itemize}\n`;
    achs.forEach(a => {
      const text = a.link 
        ? `\\href{${a.link}}{${escapeLatex(a.name)}}` 
        : escapeLatex(a.name);
      fullLatex += `\\item \\small ${text}\n`;
      // fullLatex += `\\item \\small ${escapeLatex(a)}\n`;
    });
    fullLatex += `\\end{itemize}\n`;
    fullLatex += `\\end{itemize}\n\n`;
  }

  // ---------------------------------------------------------
  // 7. EDUCATION (Conditional)
  // ---------------------------------------------------------
  const education = (content.education || []).filter(e => e.institute && e.institute.trim().length > 0);

  if (education.length > 0) {
    fullLatex += `%-----------EDUCATION-----------\n`;
    fullLatex += `\\section{EDUCATION}\n`;
    fullLatex += `\\resumeSubHeadingListStart\n`;
    
    education.forEach(edu => {
      fullLatex += `\\resumeSubheading\n`;
      fullLatex += `  {${escapeLatex(edu.institute)}}{${escapeLatex(edu.duration)}}\n`;
      
      if (edu.details && edu.details.trim().length > 0) {
        fullLatex += `  \\resumeItemListStart\n`;
        fullLatex += `    \\resumeItem{${escapeLatex(edu.details)}}\n`;
        fullLatex += `  \\resumeItemListEnd\n`;
      }
    });
    
    fullLatex += `\\resumeSubHeadingListEnd\n\n`;
  }

  // INJECT CONTENT INTO TEMPLATE
  return template.replace('{{FULL_DOCUMENT_CONTENT}}', fullLatex);
};