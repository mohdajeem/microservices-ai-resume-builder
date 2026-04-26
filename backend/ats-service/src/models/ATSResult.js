import mongoose from 'mongoose';

const ATSResultSchema = new mongoose.Schema({
  userId: { 
    type: String, 
    required: true,
    index: true 
  },
  resumeId: { 
    type: String, 
    index: true 
  },
  jdText: { 
    type: String, 
    required: true 
  },
  jdTitle: {
    type: String,
    default: 'Selected Job'
  },
  jdHash: { 
    type: String, 
    index: true 
  },
  score: { 
    type: Number, 
    required: true 
  },
  analysis: {
    summary: String,
    strengths: [String],
    improvements: [String],
    keywords_found: [String],
    keywords_missing: [String]
  },
  match_gap: {
    skills: { type: Number, default: 0 },
    experience: { type: Number, default: 0 },
    education: { type: Number, default: 0 },
    culture: { type: Number, default: 0 }
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Compound index to quickly find scan history for a specific resume + same JD
ATSResultSchema.index({ resumeId: 1, jdHash: 1 });

export default mongoose.model('ATSResult', ATSResultSchema);
