import { expect } from 'chai';
import express from 'express';
import request from 'supertest';
import { requireInternal } from '../../ai-service/src/middleware/requireInternal.js';

describe('AI Internal Security Middleware', () => {
    let app;
    const secret = "test_nexus_secret_123";

    before(() => {
        process.env.NEXUS_INTERNAL_SECRET = secret;
        app = express();
        app.use(express.json());
        app.get('/protected', requireInternal, (req, res) => res.json({ ok: true }));
    });

    it('should block requests without secret header', async () => {
        const res = await request(app).get('/protected');
        expect(res.status).to.equal(403);
        expect(res.body.error).to.include("Access denied");
    });

    it('should block requests with wrong secret header', async () => {
        const res = await request(app)
            .get('/protected')
            .set('x-nexus-secret', 'wrong_secret');
        expect(res.status).to.equal(403);
    });

    it('should allow requests with valid secret header', async () => {
        const res = await request(app)
            .get('/protected')
            .set('x-nexus-secret', secret);
        expect(res.status).to.equal(200);
        expect(res.body.ok).to.be.true;
    });
});