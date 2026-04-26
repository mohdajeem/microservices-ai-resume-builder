import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import atsRoutes from "./src/routes/atsRoutes.js";
import { requireInternal } from "./src/middleware/requireInternal.js";

dotenv.config();

// Connect to MongoDB
const MONGO_URI = process.env.MONGO_URI || "mongodb://mongodb:27017/ats_db";
mongoose.connect(MONGO_URI)
  .then(() => console.log("ATS Service Database Connected"))
  .catch(err => console.error("ATS Database Connection Error:", err));

const app = express();
const PORT = process.env.PORT || 7000;

// Note: We do NOT use express.json() globally for multipart routes 
// because Multer handles the stream. But for other routes, it's fine.
app.use(express.json());

// Health Check (PUBLIC - Must be before security check)
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', service: 'ATS-Service' });
});

app.use(requireInternal);

// Mount routes at root '/' because Gateway handles the prefix stripping
app.use("/", atsRoutes);

app.listen(PORT, () => {
  console.log(`ATS Service running on port ${PORT}`);
});