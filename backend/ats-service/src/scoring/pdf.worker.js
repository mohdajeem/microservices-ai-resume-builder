// import { parentPort, workerData } from "worker_threads";
// import { createRequire } from "module";

// global.DOMMatrix = class DOMMatrix {
//     constructor() {
//         this.is2D = true;
//     }
// };

// // Standard CommonJS require for stability
// const require = createRequire(import.meta.url);
// const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js");

// const cleanText = (text) => {
//   return text
//     .replace(/\n+/g, " ")
//     .replace(/\s+/g, " ")
//     .replace(/[•●▪►]/g, "")
//     .trim();
// };

// async function processPdf() {
//   try {
//     // 1. workerData is the Buffer sent from the Main Thread
//     const buffer = workerData;
//     const data = new Uint8Array(buffer);

//     // 2. Heavy CPU Task
//     const loadingTask = pdfjsLib.getDocument({ 
//       data, 
//       disableFontFace: true 
//     });

//     const pdf = await loadingTask.promise;
//     let fullText = "";

//     for (let i = 1; i <= pdf.numPages; i++) {
//       const page = await pdf.getPage(i);
//       const content = await page.getTextContent();
//       const pageText = content.items.map((item) => item.str).join(" ");
//       fullText += pageText + " ";
//     }

//     // 3. Send result back to Main Thread
//     parentPort.postMessage({ success: true, text: cleanText(fullText) });

//   } catch (error) {
//     // Send error back
//     parentPort.postMessage({ success: false, error: error.message });
//   }
// }

// // Execute immediately
// processPdf();


import { parentPort, workerData } from "worker_threads";
import { createRequire } from "module";

// Polyfill for node.js environment(required for some pdf.js operations)
global.DOMMatrix = class DOMMAtrix {
  constructor () {
    this.is2D = true;
  }
}

const require = createRequire(import.meta.url);
const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js");

const cleanText = (text) => {
  return text
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/[•●▪►]/g, "")
    .trim();
}

async function processPdf() {
  try{
    const buffer = workerData;
    const data = new Uint8Array(buffer);

    const loadingTask = pdfjsLib.getDocument({
      data,
      disableFontFace: true
    });
    
    const pdf = await loadingTask.promise;

    let fullText = "";
    const extractedLinks = []; // array to store found links

    for(let i = 1; i<=pdf.numPages; i++){
      const page = await pdf.getPage(i);

      // ---- 1. Get Text Content ----
      const content = await page.getTextContent();
      const pageText = content.items.map((item) => item.str).join(" ");
      fullText += pageText+ " ";

      // --- 2. Get Annotations (links) ---
      const annotaions = await page.getAnnotations();
      annotaions.forEach((annotaion) => {
        // we look for subtype 'Link' and ensure it has a 'url' property
        if(annotaion.subtype == 'Link' && annotaion.url){
          extractedLinks.push({
            page: i, // will be useful to know which page the link is on
            url: annotaion.url
          });
        }
      });
    }

    // 3. Send result back including the links
    parentPort.postMessage({
      success: true,
      text: cleanText(fullText),
      links: extractedLinks
    })
  } catch(error){
    parentPort.postMessage({success: false, error: error.message});
  }
}

processPdf();