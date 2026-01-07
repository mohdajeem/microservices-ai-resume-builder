1. ATS Service:
1.1. multer and its working (how it works in middleware)
1.2. how to extract pdf from a pdf
1.2.1. what does it mean req.file.buffer
1.2.2. what are workerClient there working
1.2.3. how to create a new Worker, what are the advantages of worker in node.js, why we use it
1.2.4. worker different .on methods in deep down
1.2.5. why we create pdf.worker.js file, what is its significance
1.2.6. what is gloabl.DOMMatrix and its constructor
1.2.7. tell me all the information and teaching about pdfjsLib
1.2.8. how to clean text, help me to learn this, by giving different examples and questions to practice
1.2.9. what is the mean => new Uint8Array(buffer), why we use it
1.2.10. give me all the operations on pdfjsLib.
1.2.11. give me all operations like pdf.getPage(i), page.getTextContent(), page.getAnnotations() and other functions if exists
1.2.12. what is parentPort.postMassage({}), and how worker node and workerClient communicate to each other
1.2.13. what should be the structure and functions to communicate or sending mess and getting response from gemini, means what are the functions we use.
1.2.14. fully teach and explain this type of text manupulation     text = text.replace(/```json|```/g, "").trim();

1.3. explain me this:
export function calculateBasicScore(resumeText, jobDescription) {
  const jdKeywords =
    jobDescription
      .toLowerCase()
      .match(/\b[a-zA-Z]{3,}\b/g)
      ?.filter((w) => !["the", "and", "for", "with"].includes(w)) || [];

  const resumeWords = new Set(resumeText.toLowerCase().split(/\W+/));
  const uniqueJD = new Set(jdKeywords);

  let matchCount = 0;
  uniqueJD.forEach((word) => {
    if (resumeWords.has(word)) matchCount++;
  });

  const score = Math.round((matchCount / uniqueJD.size) * 100);

  return {
    ats_score: isNaN(score) ? 0 : score,
    summary: "Basic keyword analysis (AI Unavailable).",
    strengths: ["Basic keyword matching performed"],
    improvements: ["AI analysis failed. Please retry."],
  };
}

1.4. teach me everything about parserController.js
