import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import interviewRoutes from './src/routes/interviewRoutes.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 8001;

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI).then(() => console.log("Interview DB Connected"));

app.use('/', interviewRoutes);

app.listen(PORT, () => console.log(`Interview Service running on ${PORT}`));