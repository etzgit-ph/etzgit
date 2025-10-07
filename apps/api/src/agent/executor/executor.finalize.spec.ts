import { ExecutorService } from './executor.service';

describe('ExecutorService finalize flow', () => {
  it('creates branch, commits, creates PR, and deletes branch', async () => {
    const svc = new ExecutorService();
    const mockGit: any = {
      writeFile: jest.fn(),
      gitStageFile: jest.fn(),
      runTests: jest.fn().mockReturnValue({ success: true, output: 'ok' }),
      gitCommit: jest.fn(),
      gitCreateBranch: jest.fn(),
      gitDeleteLocalBranch: jest.fn(),
      gitRollback: jest.fn(),
    };

    const mockGH: any = { createPullRequest: jest.fn().mockResolvedValue({ data: { html_url: 'http://pr' } }) };

    (svc as any).gitClientService = mockGit;
    (svc as any).githubService = mockGH;

    const proposals = [{ filePath: 'apps/api/src/ok.md', proposedContent: 'x', rationale: 'r' }];
    const res = await svc.executeUpgrade(proposals as any);
    expect(res).toBe(true);
    expect(mockGit.gitCreateBranch).toHaveBeenCalled();
    expect(mockGit.gitCommit).toHaveBeenCalled();
    expect(mockGH.createPullRequest).toHaveBeenCalled();
    expect(mockGit.gitDeleteLocalBranch).toHaveBeenCalled();
  });
});
