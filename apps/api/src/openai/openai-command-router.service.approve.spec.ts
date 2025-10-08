import { OpenaiCommandRouterService } from './openai-command-router.service';

const mockFileAccess = {
  writeFile: jest.fn().mockResolvedValue(undefined),
};
const mockGit = {
  checkoutBranch: jest.fn().mockResolvedValue(undefined),
  commitFile: jest.fn().mockResolvedValue(undefined),
  pushBranch: jest.fn().mockResolvedValue(undefined),
};

describe('OpenaiCommandRouterService.approveProposal', () => {
  let service: OpenaiCommandRouterService;

  beforeEach(() => {
    service = new OpenaiCommandRouterService(mockFileAccess as any, mockGit as any);
  });

  it('calls git checkout, writeFile, and commit in sequence', async () => {
    await service.approveProposal('123', 'some/path.txt', 'new content');
  expect(mockGit.checkoutBranch).toHaveBeenCalled();
  expect(mockFileAccess.writeFile).toHaveBeenCalledWith('some/path.txt', 'new content');
  expect(mockGit.commitFile).toHaveBeenCalledWith('some/path.txt', expect.any(String));
  });
});
