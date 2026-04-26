import crypto from 'crypto';

/**
 * Generates a SHA-256 hash of the provided string.
 * Used to detect changes in LaTeX code for PDF caching.
 */
export const generateHash = (content) => {
    if (!content) return null;
    return crypto
        .createHash('sha256')
        .update(content)
        .digest('hex');
};
