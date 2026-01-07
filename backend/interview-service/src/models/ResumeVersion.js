import mongoose from "mongoose";

const ResumeVersionSchema = new mongoose.Schema({
    userId: String,
    content: Object,
}, { collation: 'resumeversions', strict: false });

export default mongoose.model('ResumeVersion', ResumeVersionSchema);