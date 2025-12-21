import express from "express";
import dotenv from "dotenv";
import atsRoutes from "./src/routes/atsRoutes.js";
import { requireInternal } from "./src/middleware/requireInternal.js";

dotenv.config();

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