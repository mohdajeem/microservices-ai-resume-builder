import { GoogleGenerativeAI } from "@google/generative-ai";
import { safeParseJSON } from "../utils/jsonHelper.js";

export class GeminiProvider {
  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || "dummy_key_for_init";
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.modelName = process.env.GEMINI_MODEL || "gemini-2.0-flash";
    this.model = this.genAI.getGenerativeModel({ model: this.modelName });
  }

  async execute(prompt, schema = null) {
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();

      // Clean markdown fences
      text = text.replace(/```json|```/g, "").trim();

      if (schema) {
          return safeParseJSON(text);
      }
      return text;
    } catch (error) {
      console.error("❌ Gemini Provider Error:", error.message);
      throw error;
    }
  }
}