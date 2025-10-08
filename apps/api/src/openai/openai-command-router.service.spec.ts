import { OpenaiCommandRouterService } from './openai-command-router.service';

const mockFileAccess = {
  readFile: jest.fn().mockResolvedValue('old content here'),
};

describe('OpenaiCommandRouterService', () => {
  let service: OpenaiCommandRouterService;

  beforeEach(() => {
    service = new OpenaiCommandRouterService(mockFileAccess as any);
  });

  it('returns a ProposalResponse with correct oldContent from FileAccessService', async () => {
    const res = await service.processToolCall('writeFileProposal', {
      path: 'package.json',
      newContent: '{"name":"new"}',
      rationale: 'update name',
    });

    expect(res).not.toBeNull();
    expect(res.type).toBe('proposal');
    expect(res.payload.oldContent).toBe('old content here');
    expect(res.payload.newContent).toBe('{"name":"new"}');
    expect(res.payload.path).toBe('package.json');
  });
});
  