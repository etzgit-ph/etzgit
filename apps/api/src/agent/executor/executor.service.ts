import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { UpgradeProposalDTO } from '@aca/shared-types';
import { PROTECTED_PATHS } from '@aca/utils';
import { GitClientService } from '../../git/git-client.service';
import { GitHubService } from '../../github/github.service';

@Injectable()
export class ExecutorService {
  private readonly logger = new Logger(ExecutorService.name);
  constructor(private readonly gitClientService?: GitClientService) {}

  async executeUpgrade(proposals: UpgradeProposalDTO[]): Promise<boolean> {
    this.logger.log('Executing upgrade with proposals: ' + JSON.stringify(proposals));

    // Pre-execution protected path check
    for (const p of proposals) {
      for (const protectedPath of PROTECTED_PATHS) {
        if (p.filePath === protectedPath || p.filePath.startsWith(protectedPath)) {
          this.logger.error('Attempt to modify protected path: ' + p.filePath);
          throw new ForbiddenException('Attempt to modify protected path: ' + p.filePath);
        }
      }
    }

    // Use provided gitClientService (for tests) or create a new one
    const git = (this as any).gitClientService ?? this.gitClientService ?? new GitClientService();

    // Apply each proposal: write and stage
    for (const p of proposals) {
      git.writeFile(p.filePath, p.proposedContent);
      git.gitStageFile(p.filePath);
    }

    // Run tests
    const result = git.runTests();
    if (!result.success) {
      this.logger.error('Tests failed after applying patch: ' + result.output);
      git.gitRollback();
      return false;
    }

    // Success - now commit, create PR, and cleanup
    try {
      const branch = `autonomous/${Date.now()}`;
      git.gitCreateBranch(branch);
      const commitMsg = `[AUTONOMOUS]: feat(agent): apply ${proposals.length} changes`;
      git.gitCommit(commitMsg);

      // Create PR (use injected if present)
      const gh = (this as any).githubService ?? new GitHubService((this as any).configService);
      const pr = await gh.createPullRequest(branch, commitMsg, `Automated changes (${proposals.length})`);

      // Cleanup local branch
      git.gitDeleteLocalBranch(branch, true);

      this.logger.log('Created PR: ' + pr?.data?.html_url);
      return true;
    } catch (err) {
      this.logger.error('Finalization failed: ' + String(err));
      // attempt rollback
      try {
        git.gitRollback();
      } catch (e) {}
      return false;
    }
  }
}
