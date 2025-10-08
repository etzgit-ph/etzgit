import { ConfigService } from '@nestjs/config';
import { LLMService } from '../../src/llm/llm.service';

// This integration test runs only when OPENAI_API_KEY is present in env.
// It is intentionally skipped by default to avoid accidental real API calls.
const key = process.env.OPENAI_API_KEY || process.env.LLM_API_KEY;

describe('LLMService integration (manual)', () => {
  if (!key) {
    it('skipped - no OPENAI_API_KEY provided', () => {
      expect(true).toBe(true);
    });
    return;
  }

  it('calls real OpenAI and returns proposals (manual)', async () => {
    const mockConfig = {
      get: jest.fn().mockImplementation((k: string) => key),
    } as unknown as ConfigService;
    const svc = new LLMService(mockConfig as any);

    const req = {
      filePath: 'README.md',
      currentContent: 'Old content',
      goal: 'Suggest a tiny harmless change (one-line comment)',
    } as any;

    const out = await svc.generatePatch(req);
    expect(Array.isArray(out)).toBe(true);
  }, 60000);
});
