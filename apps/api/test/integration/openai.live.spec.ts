import request from 'supertest';

// This test only runs when an OpenAI API key is available to avoid accidental real calls.
const key = process.env.OPENAI_API_KEY || process.env.LLM_API_KEY;

if (key) {
  describe('OpenAI live integration', () => {
    it('calls /openai/chat and returns a 201 with text', async () => {
      const res = await request('http://localhost:3000')
        .post('/openai/chat')
        .send({ prompt: 'Say hello in two sentences.' })
        .set('Content-Type', 'application/json');

      expect(res.status).toBe(201);
      expect(res.text.length).toBeGreaterThan(0);
    }, 20000);
  });
} else {
  // eslint-disable-next-line jest/no-focused-tests
  describe('OpenAI live integration (skipped)', () => {
    it('skipped - no OPENAI_API_KEY provided', () => {
      expect(true).toBe(true);
    });
  });
}
