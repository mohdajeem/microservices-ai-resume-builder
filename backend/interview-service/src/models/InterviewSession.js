import mongoose, { mongo } from 'mongoose';

const InterviewSessionSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    resumeId: {type: String, required: true},
    techStack: String, // eg. "React Node.js"
    difficulty: {
        type: String,
        enum: ['Easy', 'Medium', 'Hard'],
        default: 'Medium'
    },
    status: {
        type: String,
        enum: ["active", "completed"],
        default: "active"
    },
    currentQuestionIndex: {
        type: Number,
        default: 0
    },
    totalQuestions: {
        type: Number,
        default: 5
    },
    // the conversation
    transcript: [{
        role: {
            type: String,
            enum: ["ai", "user"]
        },
        content: String,
        feedback: String,
        timeStamp: { type: Date, default: Date.now }
    }]
}, { timeStamp: true });

export default mongoose.model('InterviewSession', InterviewSessionSchema);
