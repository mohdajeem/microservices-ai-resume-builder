import { createRequire } from "module";

// 1. Create a standard 'require' function
const require = createRequire(import.meta.url);

// 2. Load the LEGACY build (Standard .js file). 
// This avoids the ESM (.mjs) conflict and Browser-only checks.
const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js");

/**
 * 🧹 Cleans artifacts, bullets, and excessive whitespace
 */
const cleanText = (text) => {
  return text
    .replace(/\n+/g, " ") // Flatten newlines
    .replace(/\s+/g, " ") // Flatten spaces
    .replace(/[•●▪►]/g, "") // Remove bullets
    .trim();
};

/**
 * 📄 Extracts text from a memory buffer
 * @param {Buffer} buffer - The file buffer from Multer
 */
export async function extractTextFromBuffer(buffer) {
  try {
    // 3. Convert Node Buffer to Uint8Array (Required by pdfjs-dist)
    const data = new Uint8Array(buffer);
    
    // 4. Load the document
    // We use the promise directly.
    const loadingTask = pdfjsLib.getDocument({ 
      data,
      // Disable font face loading (not needed for text extraction)
      disableFontFace: true 
    });
    
    const pdf = await loadingTask.promise;
    let fullText = "";

    // 5. Iterate pages to extract strings
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      
      // Join strings
      const pageText = content.items.map((item) => item.str).join(" ");
      fullText += pageText + " ";
    }

    return cleanText(fullText);

  } catch (error) {
    console.error("PDF Extraction Error:", error);
    throw new Error("Failed to parse PDF: " + error.message);
  }
}