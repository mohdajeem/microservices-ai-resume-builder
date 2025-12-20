import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import paymentRoutes from './src/routes/paymentRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 9000;

// webhook route needs raw body, others need json
app.use((req, res, next) => {
  if (req.originalUrl === '/webhook') {
    next();
  } else {
    express.json()(req, res, next);
  }
});

app.use(cors());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Payment DB Connected"))
  .catch(err => console.error("DB Error:", err));

app.use('/', paymentRoutes);

app.listen(PORT, () => {
  console.log(`XB3 Payment Service running on port ${PORT}`);
});