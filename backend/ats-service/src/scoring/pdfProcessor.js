import { createRequire } from "module";

// 1. Create a standard 'require' function
const require = createRequire(import.meta.url);

// 2. Load the LEGACY build (Standard .js file). 
// This avoids the ESM (.mjs) conflict and Browser-only checks.
const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js");

/**
 * Cleans artifacts and normalizes whitespace while preserving structure
 */
const cleanText = (text) => {
  return text
    .replace(/[•●▪►]/g, "-") // Convert bullets
    .replace(/[ ]+/g, " ")   // Normalize horizontal spaces
    .replace(/\n{3,}/g, "\n\n") // Max 2 newlines
    .trim();
};

/**
 * Extracts text from a memory buffer
 * @param {Buffer} buffer - The file buffer from Multer
 */
export async function extractTextFromBuffer(buffer) {
  try {
    console.log(`[PDF-PROCESSOR] Synchronous extraction fallback called (${buffer.length} bytes)`);
    const data = new Uint8Array(buffer);
    
    const loadingTask = pdfjsLib.getDocument({ 
      data,
      disableFontFace: false 
    });
    
    const pdf = await loadingTask.promise;
    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      
      // Sort items by Y then X (simplified spatial sort)
      const items = content.items.map(it => ({
        str: it.str,
        x: it.transform[4],
        y: it.transform[5]
      })).sort((a,b) => (Math.abs(a.y - b.y) < 5) ? (a.x - b.x) : (b.y - a.y));

      let lastY = -1;
      items.forEach(it => {
        if (lastY !== -1 && Math.abs(it.y - lastY) > 7) fullText += "\n";
        else if (fullText.length > 0 && !fullText.endsWith("\n")) fullText += " ";
        fullText += it.str;
        lastY = it.y;
      });
      fullText += "\n\n";
    }

    const result = cleanText(fullText);
    console.log(`[PDF-PROCESSOR] ✅ Extraction complete (${result.length} characters)`);
    return result;

  } catch (error) {
    console.error("[PDF-PROCESSOR] ❌ Extraction Error:", error);
    throw new Error("Failed to parse PDF: " + error.message);
  }
}