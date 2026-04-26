/**
 * Safely extracts and parses JSON from a string that might contain 
 * conversational text or markdown code blocks from AI responses.
 */
export const safeParseJSON = (text) => {
    try {
        // 1. Try direct parse first
        return JSON.parse(text);
    } catch (err) {
        try {
            // 2. Try to extract JSON from markdown or text using regex
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                // If it finds multiple, it takes the outer-most one
                return JSON.parse(jsonMatch[0]);
            }
        } catch (innerErr) {
            console.error("❌ Failed to extract JSON from AI response:", text);
            throw new Error("AI returned malformed JSON");
        }
        throw new Error("AI response contained no valid JSON structure");
    }
};