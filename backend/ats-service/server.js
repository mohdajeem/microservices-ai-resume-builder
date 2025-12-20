import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import atsRoutes from "./src/routes/atsRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 7000;

app.use(cors());

// Note: We do NOT use express.json() globally for multipart routes 
// because Multer handles the stream. But for other routes, it's fine.
app.use(express.json());

// Mount routes at root '/' because Gateway handles the prefix stripping
app.use("/", atsRoutes);

app.listen(PORT, () => {
  console.log(`🚀 ATS Service running on port ${PORT}`);
});