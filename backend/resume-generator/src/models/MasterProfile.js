// import mongoose from 'mongoose';

// const MasterProfileSchema = new mongoose.Schema({
//   userId: { type: String, required: true, unique: true, index: true },
  
//   personalInfo: {
//     name: String,
//     email: String,
//     phone: String,
//     linkedin: String,
//     github: String,
//     location: String,
//     portfolio: String
//   },
  
//   experience: [{
//     role: String,
//     company: String,
//     duration: String,
//     location: String,
//     points: [String]
//   }],

//   projects: [{
//     title: String,
//     link: String,
//     tech: String,
//     date: String,
//     points: [String]
//   }],

//   skills: {
//     languages: String,
//     frameworks: String,
//     tools: String,
//     databases: String,
//     core_concepts: String,
//     soft_skills: String
//   },

//   education: [{
//     institute: String,
//     duration: String,
//     details: String // e.g., "B.Tech CSE - CGPA: 9.0"
//   }],

//   certifications: [String],
//   achievements: [String]

// }, { timestamps: true });

// export default mongoose.model('MasterProfile', MasterProfileSchema);

import mongoose from 'mongoose';

const MasterProfileSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true, index: true },
  
  personalInfo: {
    name: String,
    email: String,
    phone: String,
    linkedin: String,
    github: String,
    location: String,
    portfolio: String
  },
  
  experience: [{
    role: String,
    company: String,
    duration: String,
    location: String,
    points: [String]
  }],

  projects: [{
    title: String,
    link: String,
    tech: String,
    date: String,
    points: [String]
  }],

  skills: {
    languages: String,
    frameworks: String,
    tools: String,
    databases: String,
    core_concepts: String,
    soft_skills: String
  },

  education: [{
    institute: String,
    duration: String,
    details: String 
  }],

  // FIXED: Changed from [String] to Array of Objects
  certifications: [{
    name: { type: String, default: "" },
    link: { type: String, default: "" }
  }],

  // FIXED: Changed from [String] to Array of Objects
  achievements: [{
    name: { type: String, default: "" },
    link: { type: String, default: "" }
  }]

}, { timestamps: true });

export default mongoose.model('MasterProfile', MasterProfileSchema);