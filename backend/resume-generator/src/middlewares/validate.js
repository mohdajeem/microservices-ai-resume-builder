import { z } from 'zod';

// 1. Define the Schema for Resume Data
export const resumeSchema = z.object({
  userId: z.string().optional(),
  jobDescription: z.string().optional(),
  
  // Frontend sends 'userData' wrapper
  userData: z.object({
    // Personal Info (Frontend sends lowercase keys inside 'personalInfo')
    personalInfo: z.object({
        name: z.string().min(2, "Name too short").max(100).optional().or(z.literal('')),
        email: z.string().email().optional().or(z.literal('')),
        phone: z.string().optional().or(z.literal('')),
        location: z.string().optional().or(z.literal('')),
        linkedin: z.string().optional().or(z.literal('')),
        github: z.string().optional().or(z.literal('')),
        portfolio: z.string().optional().or(z.literal(''))
    }).optional(),

    // Experience
    experience: z.array(z.object({
        company: z.string().optional().or(z.literal('')),
        role: z.string().optional().or(z.literal('')),
        duration: z.string().optional().or(z.literal('')),
        location: z.string().optional().or(z.literal('')),
        points: z.array(z.string()).optional()
    })).optional(),

    // Projects
    projects: z.array(z.object({
        title: z.string().optional().or(z.literal('')),
        link: z.string().optional().or(z.literal('')),
        tech: z.string().optional().or(z.literal('')),
        date: z.string().optional().or(z.literal('')),
        points: z.array(z.string()).optional()
    })).optional(),

    // Education
    education: z.array(z.object({
        institute: z.string().optional().or(z.literal('')),
        duration: z.string().optional().or(z.literal('')),
        details: z.string().optional().or(z.literal(''))
    })).optional(),

    // Skills
    skills: z.object({
        languages: z.string().optional().or(z.literal('')),
        frameworks: z.string().optional().or(z.literal('')),
        tools: z.string().optional().or(z.literal('')),
        databases: z.string().optional().or(z.literal(''))
    }).optional(),

    // NEW: Update these to accept Objects { name, link }
    certifications: z.array(z.object({
        name: z.string().optional().or(z.literal('')),
        link: z.string().optional().or(z.literal(''))
    })).optional(),

    achievements: z.array(z.object({
        name: z.string().optional().or(z.literal('')),
        link: z.string().optional().or(z.literal(''))
    })).optional()

  }).required()
});

// 2. The Middleware
export const validate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    // Log the actual validation error so you can debug 400s easily
    console.error("Zod Validation Error:", JSON.stringify(error.errors, null, 2));
    return res.status(400).json({ error: "Validation Failed", details: error.errors });
  }
};