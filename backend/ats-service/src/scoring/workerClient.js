import { Worker } from "worker_threads";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function parsePdfInWorker(buffer) {
  return new Promise((resolve, reject) => {
    
    // Create a new Worker for this specific request
    const workerPath = path.join(__dirname, "./pdf.worker.js");
    
    const worker = new Worker(workerPath, {
      workerData: buffer // Pass the file data to the worker
    });

    // Listen for the result
    worker.on("message", (result) => {
      if (result.success) {
        // resolve(result.text);
        resolve({
          text: result.text,
          links: result.links
        })
      } else {
        reject(new Error(result.error));
      }
    });

    worker.on("error", (err) => {
      reject(err);
    });

    worker.on("exit", (code) => {
      if (code !== 0) {
        reject(new Error(`Worker stopped with exit code ${code}`));
      }
    });
  });
}