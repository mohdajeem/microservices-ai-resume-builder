import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5001/api/ai';
const INTERNAL_SECRET = process.env.NEXUS_INTERNAL_SECRET;

/**
 * Lightweight client to communicate with the AI Orchestrator Service
 */
export const aiClient = {
  /**
   * Generates content using the AI Orchestrator
   * @param {string} task - The task name (e.g., 'ATS_SCAN', 'RESUME_AUDIT')
   * @param {object} data - The data required for the task
   * @param {string} [provider] - Optional provider override
   * @param {boolean} [bypassCache] - Force a fresh AI generation
   */
  generate: async (task, data, provider = null, bypassCache = false) => {
    try {
      const payload = { 
        task, 
        data,
        bypassCache: bypassCache === true
      };
      if (provider) payload.provider = provider;

      const response = await axios.post(`${AI_SERVICE_URL}/generate`, payload, {
        headers: {
          'x-nexus-secret': INTERNAL_SECRET,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error(`❌ AI Orchestrator Error (${task}):`, error.response?.data || error.message);
      throw error;
    }
  }
};