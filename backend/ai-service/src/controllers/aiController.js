import { providerFactory } from '../providers/factory.js';
import { PROMPTS } from '../prompts/registry.js';
import aiCache, { generateCacheKey } from '../utils/cache.js';

export const handleAIRequest = async (req, res) => {
  const { task, data, provider = 'groq', bypassCache = false } = req.body;

  try {
    const promptTemplate = PROMPTS[task];
    if (!promptTemplate) {
      return res.status(400).json({ error: `Task ${task} not found in registry` });
    }

    // 1. Check Cache (Skip for non-idempotent or requested bypass)
    const cacheKey = generateCacheKey(task, data);
    if (!bypassCache) {
        const cachedResponse = aiCache.get(cacheKey);
        if (cachedResponse) {
            console.log(`[AI-ORCHESTRATOR] ⚡ Cache Hit for Task: ${task}`);
            return res.json(cachedResponse);
        }
    }

    // 2. Prepare Prompt (Previous logic continued...)
    const isObjectFormat = typeof promptTemplate === 'object' && promptTemplate.template;
    const promptFn = isObjectFormat ? promptTemplate.template : promptTemplate;
    const taskProvider = isObjectFormat ? promptTemplate.provider : null;

    // Logic to handle different prompt data types
    const inputData = data.resume || data.resumeText || data;
    let prompt;

    if (task === 'TAILORED_SUMMARY') {
      prompt = (typeof promptFn === 'function') 
        ? promptFn(data.resumeText, data.jobDescription)
        : promptFn;
    } else {
      prompt = typeof promptFn === 'function' 
        ? promptFn(inputData, data.jobDescription || data.linksContext, data.atsImprovements, data.compactMode)
        : promptFn;
    }

    // Priority: Request provider > Registry task provider > Default system provider
    const selectedProvider = provider !== 'groq' ? provider : (taskProvider || provider);
    
    // Determine if the task requires JSON output based on registry structure
    // If the task has a 'schema' property or is part of core structured tasks, we use JSON format.
    const requiresJSON = !!PROMPTS[task]?.schema || 
                        ['ATS_SCAN', 'RESUME_PARSE', 'RESUME_AUDIT', 'INTERVIEW_TURN', 'COVER_LETTER', 'SMART_SKILLS', 'REWRITE_COMPACT'].includes(task);

    const aiProvider = providerFactory.getProvider(selectedProvider);
    console.log(`[AI-ORCHESTRATOR] 🤖 Executing Task: ${task} using Provider: ${selectedProvider}`);
    const result = await aiProvider.execute(prompt, requiresJSON);

    console.log(`[AI-ORCHESTRATOR] ✅ Task Completed: ${task}. Result Length: ${JSON.stringify(result).length}`);
    
    // Standardize response for specific tasks to avoid nesting issues in consumers
    const flatTasks = ['ATS_SCAN', 'RESUME_PARSE', 'RESUME_AUDIT', 'INTERVIEW_TURN', 'COVER_LETTER', 'SMART_SKILLS', 'REWRITE_COMPACT'];
    const finalResult = flatTasks.includes(task) ? result : { success: true, data: result };

    // 3. Cache the final response
    if (!bypassCache) {
        aiCache.set(cacheKey, finalResult);
        console.log(`[AI-ORCHESTRATOR] 💾 Cached Result for Task: ${task}`);
    }

    return res.json(finalResult);
  } catch (error) {
    console.error("❌ AI Controller Error:", error);
    res.status(500).json({ error: 'AI Orchestration failed', details: error.message });
  }
};