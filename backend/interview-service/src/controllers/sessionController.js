import InterviewSession from "../models/InterviewSession.js";
import ResumeVersion from "../models/ResumeVersion.js";
import { startInterview, processTurn } from "../services/aiInterviewService.js";

// POST /start

export const startSession = async (req, res) => {
    try{
        const userId = req.headers['x-user-id'];
        const { resumeId, techStack, difficulty } = req.body;
        console.log("startSession has been called");
        console.log("req.body: ", req.body);
        // 1. Fetch Resume Data to give AI context
        const resume = await ResumeVersion.findById(resumeId);
        if(!resume) return res.status(404).json({ error: "Resume not found" });

        // 2. Generate First Question
        const question = await startInterview(resume.content, techStack || "Full Stack");

        // 3. Create Session
        const session = new InterviewSession({
            userId,
            resumeId,
            techStack, 
            difficulty,
            transcript: [{role: 'ai', content: question}]
        });

        await session.save();

        res.json({ sessionId: session._id, message: question });
    } catch(error){
        console.error(error);
        res.status(500).json({error: "Failed to start interview" });
    }
};

// POST /chat
export const handleChat = async (req, res) => {
    try{
        const { sessionId, answer } = req.body;
        console.log("handleChat section: ", req.body);
        const session = await InterviewSession.findById(sessionId);
        if(!sessionId || session.status === 'completed'){
            return res.status(400).json({ error: "Invalid or completed session" });
        }

        // 1. Save User Answer
        session.transcript.push({role: 'user', content: answer});

        // 2. Check loop limit (5 Questions)
        if(session.currentQuestionIndex >= session.totalQuestions){
            session.status = 'completed';
            session.transcript.push({role: 'ai', content: "Thank you." });
            await session.save();
            return res.json({ message: "Interview Completed", isCompleted: true });
        }

        // 3. AI Process 
        const aiResponse = await processTurn(session.transcript, answer, session.techStack);
        session.transcript.push({
            role: 'ai',
            content: aiResponse.nextQuestion,
            feedback: aiResponse.feedback // hide it for later report
        });

        session.currentQuestionIndex += 1;
        await session.save();

        res.json({
            message: aiResponse.nextQuestion,
            feedback: aiResponse.feedback, // fronted can choose to show or hide
            isCompleted: false
        })
    } catch (error){
        console.error(error);
        res.status(500).json({error: "AI Error"});
    }
};