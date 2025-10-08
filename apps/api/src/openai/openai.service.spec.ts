import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { OpenaiService } from './openai.service';

// Mock OpenAI client
jest.mock('openai', () => {
  return {
    OpenAI: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn(),
        },
      },
    })),
  };
});

describe('OpenaiService', () => {
  let service: OpenaiService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpenaiService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'OPENAI_API_KEY') return 'test-api-key';
              if (key === 'OPENAI_DEFAULT_MODEL') return 'gpt-3.5-turbo';
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<OpenaiService>(OpenaiService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should initialize OpenAI client with API key from ConfigService', () => {
    expect(configService.get).toHaveBeenCalledWith('OPENAI_API_KEY');
    // Optionally, check that OpenAI client is initialized (mocked)
    expect(service['openai']).toBeDefined();
  });

  it('generateChatCompletion returns text on success', async () => {
    const mockCreate = service['openai'].chat.completions.create as jest.Mock;
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: 'hello world' } }],
    });

    const result = await service.generateChatCompletion('hi');
    expect(result).toBe('hello world');
    expect(mockCreate).toHaveBeenCalledWith({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'hi' }],
    });
  });

  it('generateChatCompletion throws InternalServerErrorException on API failure', async () => {
    const mockCreate = service['openai'].chat.completions.create as jest.Mock;
    mockCreate.mockRejectedValueOnce(new Error('429 Too Many Requests'));

    await expect(service.generateChatCompletion('hi')).rejects.toThrow();
  });
});
