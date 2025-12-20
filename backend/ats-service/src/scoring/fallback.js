/**
 * Simple keyword matching score (Backup Logic)
 */
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