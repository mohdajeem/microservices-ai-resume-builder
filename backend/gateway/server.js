import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import compression from 'compression';
import proxyRoutes from './src/routes/proxyRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// 1. Security Headers (Hides "X-Powered-By: Express")
app.use(helmet());

// 2. Compression (Makes responses faster)
app.use(compression());

// 3. CORS (Restrict who can access your API)
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));

// 4. Rate Limiting is applied inside proxyRoutes.js per route

// 5. Health Check
app.get('/', (req, res) => {
  res.send('🛡️ Secure Gateway Running');
});

// 6. Routes
proxyRoutes(app);

app.listen(PORT, () => {
  console.log(`🌐 Secure Gateway running on http://localhost:${PORT}`);
});