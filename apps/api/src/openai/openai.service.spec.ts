import { ConfigService } from '@nestjs/config';
import { OpenAI } from 'openai';
import { OpenaiService } from './openai.service';

describe('OpenaiService', () => {
  let service: OpenaiService;
  let configService: ConfigService;

  beforeEach(() => {
    configService = {
      get: jest.fn((key: string) => {
        if (key === 'OPENAI_API_KEY') return 'test-key';
        if (key === 'OPENAI_DEFAULT_MODEL') return 'gpt-4';
        return undefined;
      }),
    } as any;
    service = new OpenaiService(configService);
  });

  it('should initialize OpenAI client with API key from config', () => {
    expect(service['openai']).toBeInstanceOf(OpenAI);
    expect(configService.get).toHaveBeenCalledWith('OPENAI_API_KEY');
  });

  it('should throw if model name is missing', async () => {
    (configService.get as jest.Mock).mockReturnValueOnce('test-key').mockReturnValueOnce(undefined);
    await expect(service.generateChatCompletion('prompt')).rejects.toThrow(
      'OpenAI model name is not configured',
    );
  });

  it('should call OpenAI chat completion and return result', async () => {
    const mockCreate = jest
      .fn()
      .mockResolvedValue({ choices: [{ message: { content: 'response' } }] });
    service['openai'].chat = { completions: { create: mockCreate } } as any;
    const result = await service.generateChatCompletion('prompt', 'gpt-4');
    expect(result).toBe('response');
    expect(mockCreate).toHaveBeenCalledWith({
      model: 'gpt-4',
      messages: [{ role: 'user', content: 'prompt' }],
    });
  });

  it('should handle OpenAI API errors securely', async () => {
    const mockCreate = jest.fn().mockRejectedValue(new Error('API error'));
    service['openai'].chat = { completions: { create: mockCreate } } as any;
    await expect(service.generateChatCompletion('prompt', 'gpt-4')).rejects.toThrow(
      'Failed to generate chat completion',
    );
  });
});
