import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://ai-service:5005';
const INTERNAL_SECRET = process.env.NEXUS_INTERNAL_SECRET;

/**
 * Centrialized client for communicating with the AI Orchestrator Service.
 */
class AIClient {
  async generate(task, data, provider = null) {
    try {
      const response = await axios.post(`${AI_SERVICE_URL}/api/ai/generate`, {
        task,
        data,
        provider
      }, {
        headers: {
          'x-nexus-secret': INTERNAL_SECRET,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30s timeout for AI tasks
      });

      return response.data;
    } catch (error) {
      console.error(`AI Client Error (${task}):`, error.response?.data || error.message);
      throw new Error(error.response?.data?.message || `AI Service failed for task: ${task}`);
    }
  }
}

export const aiClient = new AIClient();