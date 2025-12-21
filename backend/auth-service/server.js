import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { mongoSanitize } from './src/middlewares/security.js';
import authRoutes from './src/routes/authRoutes.js';
import { requireInternal } from './src/middlewares/requireInternal.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000; // Auth runs on 4000

app.use(express.json());

// 2. HEALTH CHECK (Public - Before Security)
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', service: 'Auth-Service' });
});

app.use(requireInternal);
// 3. SANITIZE HERE (The Guard)
// This strips out keys containing "$" or "." from req.body, req.query, or req.params
app.use(mongoSanitize);

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Auth DB Connected"))
  .catch(err => console.error(err));

// Mount at root because Gateway handles the /api/auth prefix stripping
app.use('/', authRoutes); 

app.listen(PORT, () => {
  console.log(`Auth Service running on port ${PORT}`);
});