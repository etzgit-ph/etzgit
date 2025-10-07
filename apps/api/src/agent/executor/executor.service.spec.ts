import { ExecutorService } from './executor.service';
import { UpgradeProposalDTO } from '@aca/shared-types';

describe('ExecutorService', () => {
  it('throws when proposal targets protected path', async () => {
    const svc = new ExecutorService();
    const proposals: UpgradeProposalDTO[] = [
      { filePath: 'SECURITY.md', proposedContent: 'x', rationale: 'test' },
    ];
    await expect(svc.executeUpgrade(proposals)).rejects.toThrow();
  });

  it('writes and stages files and runs tests, rolls back on failure', async () => {
    // Mock GitClientService methods by monkeypatching an instance onto ExecutorService
    const svc = new ExecutorService();

    const mockGit: any = {
      writeFile: jest.fn(),
      gitStageFile: jest.fn(),
      runTests: jest.fn().mockReturnValue({ success: false, output: 'fail' }),
      gitRollback: jest.fn(),
    };

    // inject mock via any cast
    (svc as any).gitClientService = mockGit;

    const proposals: UpgradeProposalDTO[] = [
      { filePath: 'apps/api/src/SOMEFILE.md', proposedContent: 'x', rationale: 'test' },
    ];

    await expect(svc.executeUpgrade(proposals)).resolves.toBe(false);
    expect(mockGit.writeFile).toHaveBeenCalled();
    expect(mockGit.gitStageFile).toHaveBeenCalled();
    expect(mockGit.runTests).toHaveBeenCalled();
    expect(mockGit.gitRollback).toHaveBeenCalled();
  });
});
