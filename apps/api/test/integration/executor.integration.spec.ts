import { ExecutorService } from '../../src/agent/executor/executor.service';

describe('ExecutorService rollback behavior', () => {
  it('should rollback when tests fail and not commit', async () => {
    const mockGit: any = {
      writeFile: jest.fn(),
      gitStageFile: jest.fn(),
      runTests: jest.fn().mockReturnValue({ success: false, output: 'failing' }),
      gitRollback: jest.fn(),
      gitCreateBranch: jest.fn(),
      gitCommit: jest.fn(),
      gitDeleteLocalBranch: jest.fn(),
    };

    const service = new ExecutorService();
    // inject the mock git client
    (service as any).gitClientService = mockGit;

    const proposals = [
      {
        filePath: 'apps/api/src/somefile.ts',
        proposedContent: 'console.log(1);',
        rationale: 'test',
      },
    ];

    const result = await service.executeUpgrade(proposals as any);

    expect(result).toBe(false);
    expect(mockGit.gitRollback).toHaveBeenCalledTimes(1);
    expect(mockGit.gitCommit).not.toHaveBeenCalled();
  });
});
