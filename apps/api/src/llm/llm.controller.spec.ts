import { Test, TestingModule } from '@nestjs/testing';
import { LLMController } from './llm.controller';
import { LLMService } from './llm.service';
import { SecretTokenGuard } from '../common/guards/secret-token.guard';
import { ConfigService } from '@nestjs/config';
import { SecurityAuditService } from '../common/services/security-audit.service';

describe('LLMController (demo)', () => {
  let controller: LLMController;
  let service: LLMService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LLMController],
      providers: [
        {
          provide: LLMService,
          useValue: {
            generatePatch: jest
              .fn()
              .mockResolvedValue([
                { filePath: 'README.md', proposedContent: 'x', rationale: 'test' },
              ]),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest
              .fn()
              .mockImplementation((k) => (k === 'AGENT_RUN_SECRET' ? 'secret' : 'test')),
          },
        },
        {
          provide: SecurityAuditService,
          useValue: { logEvent: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<LLMController>(LLMController);
    service = module.get<LLMService>(LLMService);
  });

  it('returns proposals from llm service', async () => {
    const req = { filePath: 'README.md', currentContent: 'old', goal: 'improve' } as any;
    const res = await controller.demo(req);
    expect(res.proposals[0].filePath).toBe('README.md');
  });
});
