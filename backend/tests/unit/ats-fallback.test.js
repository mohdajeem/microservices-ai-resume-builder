import { expect } from 'chai';
import { calculateBasicScore } from '../../ats-service/src/scoring/fallback.js';

describe('ATS Fallback Scoring Engine', () => {
  it('should return 100% match when all JD keywords are in resume', () => {
    const jd = "React Node Express";
    const resume = "React, Node, Express development experience";
    const result = calculateBasicScore(resume, jd);
    expect(result.ats_score).to.equal(100);
  });

  it('should return 0% match when no keywords match', () => {
    const jd = "Python Django";
    const resume = "React Node Express";
    const result = calculateBasicScore(resume, jd);
    expect(result.ats_score).to.equal(0);
  });

  it('should handle empty inputs gracefully', () => {
    const result = calculateBasicScore("", "");
    expect(result.ats_score).to.equal(0);
    expect(result.summary).to.include("Basic keyword analysis");
  });
});