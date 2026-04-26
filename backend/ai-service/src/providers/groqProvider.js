import Groq from "groq-sdk";
import { safeParseJSON } from "../utils/jsonHelper.js";

export class GroqProvider {
  constructor() {
    const apiKey = process.env.GROQ_API_KEY || "dummy_key_for_init";
    this.groq = new Groq({ apiKey });
    this.model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
  }

  async execute(prompt, schema = null) {
    try {
      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        model: this.model,
        response_format: schema ? { type: "json_object" } : { type: "text" },
      });

      const text = completion.choices[0]?.message?.content;

      if (schema) {
        return safeParseJSON(text);
      }
      return text;
    } catch (error) {
      console.error("❌ Groq Provider Error:", error.message);
      throw error;
    }
  }
}