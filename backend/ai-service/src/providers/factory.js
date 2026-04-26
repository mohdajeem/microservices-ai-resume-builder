import { GeminiProvider } from './geminiProvider.js';
import { GroqProvider } from './groqProvider.js';

class ProviderFactory {
  constructor() {
    this.providers = {
      gemini: new GeminiProvider(),
      groq: new GroqProvider(),
    };
  }

  getProvider(name) {
    // Allows switching via environment variable or manual name
    const selectedProvider = name || process.env.DEFAULT_AI_PROVIDER || 'gemini';
    const provider = this.providers[selectedProvider];
    
    if (!provider) {
      console.warn(`⚠️ Provider ${selectedProvider} not found, falling back to Gemini`);
      return this.providers['gemini'];
    }
    return provider;
  }
}

export const providerFactory = new ProviderFactory();
