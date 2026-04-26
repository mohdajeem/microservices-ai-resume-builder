import NodeCache from 'node-cache';
import crypto from 'crypto';

// Cache expires in 6 hours (21600 seconds)
// Check for expired entries every 10 minutes (600 seconds)
const aiCache = new NodeCache({ stdTTL: 21600, checkperiod: 600 });

/**
 * Generate a unique hash for the AI request inputs
 * @param {string} task - The AI task (e.g., RESUME_AUDIT)
 * @param {object} data - The input data (resume, jd, etc.)
 * @returns {string} - MD5 hash of inputs
 */
export const generateCacheKey = (task, data) => {
  // Normalize data to ensure consistent hashes
  const payload = JSON.stringify({
    task,
    // We only hash the essential content to identify duplicate requests
    resume: data.resume || data.resumeText || '',
    jd: data.jobDescription || '',
    context: data.linksContext || '',
    improvements: data.atsImprovements || ''
  });
  
  return crypto.createHash('md5').update(payload).digest('hex');
};

export default aiCache;
