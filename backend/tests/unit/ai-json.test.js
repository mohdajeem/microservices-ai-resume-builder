import { expect } from 'chai';
import { safeParseJSON } from '../../ai-service/src/utils/jsonHelper.js';

describe('AI JSON Helper (Robust Parsing)', () => {
  it('should parse clean JSON correctly', () => {
    const json = '{"key": "value"}';
    const result = safeParseJSON(json);
    expect(result).to.deep.equal({ key: "value" });
  });

  it('should extract JSON from markdown code blocks', () => {
    const md = 'Here is the result: \n```json\n{"score": 85}\n```\nHope it helps!';
    const result = safeParseJSON(md);
    expect(result).to.deep.equal({ score: 85 });
  });

  it('should throw error on invalid JSON with no structure', () => {
    const text = 'Hello world, no json here';
    expect(() => safeParseJSON(text)).to.throw("AI response contained no valid JSON structure");
  });
});