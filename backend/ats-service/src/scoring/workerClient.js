import { Piscina } from "piscina";
import path from "path";
import { fileURLToPath } from "url";
import os from "os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Piscina worker pool
// minThreads: minimum threads to keep alive
// maxThreads: maximum threads to spawn based on CPU cores
const pool = new Piscina({
  filename: path.join(__dirname, "./pdf.worker.js"),
  minThreads: Math.max(1, Math.floor(os.cpus().length / 4)), 
  maxThreads: Math.max(2, os.cpus().length)
});

export async function parsePdfInWorker(buffer) {
  try {
    // Run the task in the pool
    const result = await pool.run(buffer);

    if (result.success) {
      return {
        text: result.text,
        links: result.links
      };
    } else {
      throw new Error(result.error || "Unknown worker error");
    }
  } catch (err) {
    console.error("Worker Pool Error:", err);
    throw err;
  }
}