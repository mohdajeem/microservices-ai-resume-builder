import mongoose from 'mongoose';

const ResumeVersionSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  masterProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'MasterProfile' },
  
  // Context for this specific version
  versionName: { type: String, default: 'Default Resume' }, // e.g. "Google Application"
  jobDescription: String, 
  
  // The Snapshot Data (Cloned from Master, then modified by AI/User)
  // This is what the frontend needs to populate the form
  content: {
    personalInfo: Object,
    experience: [Object],
    projects: [Object],
    skills: Object,
    education: [Object],
    certifications: [{
      name: String,
      link: String
    }],
    achievements: [{
      name: String,
      link: String
    }]
  },

  // SCALABILITY KEY: We store the generated code.
  // We DO NOT regenerate this on every read.
  latexCode: { type: String, required: true },
  
  // ATS Data (Saved from ATS Service)
  atsScore: { type: Number, default: 0 },
  atsAnalysis: {
    suggestions: [String],
    missingKeywords: [String]
  }

}, { timestamps: true });

export default mongoose.model('ResumeVersion', ResumeVersionSchema);





// import mongoose from 'mongoose';

// const ResumeVersionSchema = new mongoose.Schema({
//   userId: { type: String, required: true, index: true },
//   masterProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'MasterProfile' },
  
//   // Context for this specific version
//   versionName: { type: String, default: 'Default Resume' }, // e.g. "Google Application"
//   jobDescription: String, 
  
//   // The Snapshot Data (Cloned from Master, then modified by AI/User)
//   // This is what the frontend needs to populate the form
//   content: {
//     personalInfo: Object,
//     experience: [Object],
//     projects: [Object],
//     skills: Object,
//     education: [Object],
//     certifications: [String],
//     achievements: [String]
//   },

//   // SCALABILITY KEY: We store the generated code.
//   // We DO NOT regenerate this on every read.
//   latexCode: { type: String, required: true },
  
//   // ATS Data (Saved from ATS Service)
//   atsScore: { type: Number, default: 0 },
//   atsAnalysis: {
//     suggestions: [String],
//     missingKeywords: [String]
//   }

// }, { timestamps: true });

// export default mongoose.model('ResumeVersion', ResumeVersionSchema);