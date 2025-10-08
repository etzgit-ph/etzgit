import { ConfigService } from '@nestjs/config';
import { LLMService } from './llm.service';
import { PatchRequestDTO } from '@aca/shared-types';

jest.mock('openai', () => {
  const create = jest.fn();
  const OpenAI = jest.fn().mockImplementation(() => ({
    chat: {
      completions: { create },
    },
  }));
  return { OpenAI, __mockCreate: create };
});

describe('LLMService', () => {
  let service: LLMService;
  const mockConfig = { get: jest.fn().mockReturnValue('test-key') } as unknown as ConfigService;

  beforeEach(() => {
    // Instantiate directly with a mocked ConfigService
    service = new LLMService(mockConfig);
  });

  it('returns parsed UpgradeProposalDTO array on valid LLM JSON', async () => {
    // Access the exported mock create function
    // @ts-ignore
    const { __mockCreate: mockCreate } = require('openai');

    const fakeResp = {
      choices: [
        {
          message: {
            content: JSON.stringify([
              { filePath: 'README.md', proposedContent: 'New', rationale: 'Improve' },
            ]),
          },
        },
      ],
    };

    mockCreate.mockResolvedValueOnce(fakeResp);

    const req: PatchRequestDTO = {
      filePath: 'README.md',
      currentContent: 'Old',
      goal: 'Make better',
    };

    const out = await service.generatePatch(req);
    expect(Array.isArray(out)).toBe(true);
    expect(out[0].filePath).toBe('README.md');
  });

  it('parses JSON wrapped in triple backticks', async () => {
    // @ts-ignore
    const { __mockCreate: mockCreate } = require('openai');

    const wrapped =
      'Here is the patch:\n```json\n[{"filePath":"README.md","proposedContent":"New","rationale":"Improve"}]\n```';
    const fakeResp = { choices: [{ message: { content: wrapped } }] };
    mockCreate.mockResolvedValueOnce(fakeResp);

    const req: PatchRequestDTO = {
      filePath: 'README.md',
      currentContent: 'Old',
      goal: 'Make better',
    };

    const out = await service.generatePatch(req);
    expect(out[0].rationale).toBe('Improve');
  });

  it('parses JSON inside commentary text', async () => {
    // @ts-ignore
    const { __mockCreate: mockCreate } = require('openai');

    const wrapped =
      'I suggest the following changes:\n[{"filePath":"README.md","proposedContent":"New","rationale":"Improve"}]\nLet me know.';
    const fakeResp = { choices: [{ message: { content: wrapped } }] };
    mockCreate.mockResolvedValueOnce(fakeResp);

    const req: PatchRequestDTO = {
      filePath: 'README.md',
      currentContent: 'Old',
      goal: 'Make better',
    };

    const out = await service.generatePatch(req);
    expect(out[0].proposedContent).toBe('New');
  });

  it('throws when LLM returns invalid JSON', async () => {
    // @ts-ignore
    const { __mockCreate: mockCreate } = require('openai');

    const fakeResp = { choices: [{ message: { content: 'not-json' } }] };
    mockCreate.mockResolvedValueOnce(fakeResp);

    const req: PatchRequestDTO = {
      filePath: 'README.md',
      currentContent: 'Old',
      goal: 'Make better',
    };

    await expect(service.generatePatch(req)).rejects.toThrow('LLM did not return valid JSON');
  });

  it('rejects payloads missing required fields (zod validation)', async () => {
    // @ts-ignore
    const { __mockCreate: mockCreate } = require('openai');

    // Return JSON array missing `rationale` field
    const invalid = JSON.stringify([{ filePath: 'README.md', proposedContent: 'New' }]);
    const fakeResp = { choices: [{ message: { content: invalid } }] };
    mockCreate.mockResolvedValueOnce(fakeResp);

    const req = {
      filePath: 'README.md',
      currentContent: 'Old',
      goal: 'Make better',
    } as any;

    await expect(service.generatePatch(req)).rejects.toThrow();
  });

  it('accepts a valid UpgradeProposalDTO array', async () => {
    // @ts-ignore
    const { __mockCreate: mockCreate } = require('openai');

    const valid = JSON.stringify([
      { filePath: 'README.md', proposedContent: 'New', rationale: 'Because' },
    ]);
    const fakeResp = { choices: [{ message: { content: valid } }] };
    mockCreate.mockResolvedValueOnce(fakeResp);

    const req = {
      filePath: 'README.md',
      currentContent: 'Old',
      goal: 'Make better',
    } as any;

    const out = await service.generatePatch(req);
    expect(out[0].rationale).toBe('Because');
  });
});
