import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
// import mongoSanitize from 'express-mongo-sanitize'; // <--- 1. IMPORT
import { mongoSanitize } from './src/middlewares/security.js';
import apiRoutes from './src/routes/apiRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// 3. SANITIZE HERE
app.use(mongoSanitize);


// Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ DB Error:", err));

// Routes
// CRITICAL FIX: Gateway sends requests stripped of prefixes (e.g., /create).
// So we must mount at '/' not '/api'.
app.use('/', apiRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Resume Microservice running on http://localhost:${PORT}`);
});