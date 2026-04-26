import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import aiRoutes from './src/routes/aiRoutes.js';
import { requireInternal } from './src/middleware/requireInternal.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5005;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Health check is public
app.get('/health', (req, res) => res.json({ status: 'AI Service is running' }));

// Protect all AI routes
app.use('/api/ai', requireInternal, aiRoutes);

app.listen(PORT, () => {
  console.log(`🚀 AI Orchestrator running on port ${PORT}`);
});