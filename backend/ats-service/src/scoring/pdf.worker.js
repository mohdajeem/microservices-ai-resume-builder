import { createRequire } from "module";

// Polyfill for node.js environment(required for some pdf.js operations)
global.DOMMatrix = class DOMMAtrix {
  constructor () {
    this.is2D = true;
  }
}

const require = createRequire(import.meta.url);
const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js");

/**
 * Advanced text cleanup that preserves semantic structure
 */
const cleanText = (text) => {
  return text
    .replace(/[•●▪►]/g, "-") // Convert bullets to standard dashes
    .replace(/[^\x20-\x7E\n\t]/g, "") // Remove non-printable characters but keep newlines/tabs
    .replace(/[ ]+/g, " ") // Collapse multiple spaces but preserve single ones
    .trim();
}

export default async function processPdf(buffer) {
  try {
    console.log(`[PDF-WORKER] 📄 Starting extraction for buffer (${buffer.length} bytes)`);
    const data = new Uint8Array(buffer);

    const loadingTask = pdfjsLib.getDocument({
      data,
      disableFontFace: false, // Enabled for better font support
      useSystemFonts: true,
      isEvalSupported: false
    });
    
    const pdf = await loadingTask.promise;
    console.log(`[PDF-WORKER] 📑 PDF loaded: ${pdf.numPages} pages found`);

    let fullText = "";
    const extractedLinks = [];

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        
        // 1. Get Text Content
        const content = await page.getTextContent();
        
        // --- ADDED DEBUG LOGGING ---
        console.log(`[PDF-WORKER] Page ${i}: Found ${content.items.length} raw text items`);
        if (content.items.length > 0) {
            console.log(`[PDF-WORKER] First 3 items:`, content.items.slice(0, 3).map(it => it.str));
        }

        // 2. Spatial Sorting
        const items = content.items.map(item => ({
            str: item.str,
            x: item.transform[4],
            y: item.transform[5],
            height: item.height
        }));

        items.sort((a, b) => {
            if (Math.abs(a.y - b.y) < 5) {
                return a.x - b.x;
            }
            return b.y - a.y;
        });

        let pageText = "";
        let lastY = -1;

        items.forEach((item) => {
            if (lastY !== -1 && Math.abs(item.y - lastY) > 7) {
                pageText += "\n";
            } else if (pageText.length > 0 && !pageText.endsWith("\n")) {
                pageText += " ";
            }
            
            pageText += item.str;
            lastY = item.y;
        });

        fullText += pageText + "\n\n";
        // ---------------------------


      // 3. Get Annotations (links)
      const annotations = await page.getAnnotations();
      annotations.forEach((annot) => {
        if (annot.subtype === 'Link' && annot.url) {
          extractedLinks.push({
            page: i,
            url: annot.url
          });
        }
      });
    }

    const cleanedResult = cleanText(fullText);
    
    // --- BEAUTIFIED LOGGING FOR VERIFICATION ---
    console.log("\n" + "=".repeat(50));
    console.log("📄 EXTRACTED RESUME TEXT CONTENT");
    console.log("=".repeat(50));
    // Split into lines for cleaner log output
    cleanedResult.split("\n").forEach(line => {
      if (line.trim()) console.log(line);
    });
    console.log("=".repeat(50));
    console.log(`[PDF-WORKER] ✅ Extraction complete. Length: ${cleanedResult.length} chars, Links: ${extractedLinks.length}`);
    console.log("=".repeat(50) + "\n");
    
    // Warn if content is unexpectedly low
    if (cleanedResult.length < 100 && pdf.numPages > 0) {
      console.warn(`[PDF-WORKER] ⚠️  Warning: Very low text content extracted (${cleanedResult.length} chars). Possible image-based PDF.`);
    }

    return {
      success: true,
      text: cleanedResult,
      links: extractedLinks
    };
  } catch (error) {
    console.error("[PDF-WORKER] ❌ Extraction Error:", error);
    return { success: false, error: error.message };
  }
}