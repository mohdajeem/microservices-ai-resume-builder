import { expect } from 'chai';
import { calculateBasicScore } from '../../ats-service/src/scoring/fallback.js';
import { safeParseJSON } from '../../ai-service/src/utils/jsonHelper.js';
import { generateHash } from '../../resume-generator/src/utils/hashHelper.js';

describe('Feature Validation: ATS & AI Logic', () => {
    
    describe('ATS Recalculation (Cache Bypass)', () => {
        it('should correctly identify keyword matches in fallback mode', () => {
            const jd = "React Node Docker";
            const resume = "Experienced in React and Node development. Familiar with Docker.";
            const result = calculateBasicScore(resume, jd);
            
            expect(result.ats_score).to.be.greaterThan(0);
            expect(result.summary).to.include("Basic keyword analysis");
        });
    });

    describe('Robust AI JSON Parsing', () => {
        it('should extract JSON from aggressive markdown formatting', () => {
            const messyResponse = "Sure, here is your audit: \n\n ```json\n {\"score\": 85, \"fixes\": []} \n``` \n Hope this helps!";
            const result = safeParseJSON(messyResponse);
            expect(result.score).to.equal(85);
        });
    });

    describe('Layout Change Detection (One-Page Mode)', () => {
        it('should generate different hashes for compact vs normal mode', () => {
            const content = "Resume Content";
            const hashNormal = generateHash(content + "normal_spacing");
            const hashCompact = generateHash(content + "compact_spacing");
            expect(hashNormal).to.not.equal(hashCompact);
        });
    });
});
