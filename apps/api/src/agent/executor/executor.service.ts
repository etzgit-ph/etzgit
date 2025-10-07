import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { UpgradeProposalDTO } from '@aca/shared-types';
import { PROTECTED_PATHS } from '@aca/utils';
import { ProtectedPathModificationError } from '@aca/exceptions';
import { GitClientService } from '../../git/git-client.service';
import { GitHubService } from '../../github/github.service';
import { SecretScannerService } from './secret-scanner.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ExecutorService {
  private readonly logger = new Logger(ExecutorService.name);
  constructor(private readonly gitClientService?: GitClientService, private readonly secretScanner?: SecretScannerService) {}

  async executeUpgrade(proposals: UpgradeProposalDTO[]): Promise<boolean> {
    this.logger.log('Executing upgrade with proposals: ' + JSON.stringify(proposals));

    // Pre-execution protected path check
    for (const p of proposals) {
      for (const protectedPath of PROTECTED_PATHS) {
        if (p.filePath === protectedPath || p.filePath.startsWith(protectedPath)) {
          this.logger.error('Attempt to modify protected path: ' + p.filePath);
          throw new ProtectedPathModificationError(p.filePath);
        }
      }
    }

    // Use provided gitClientService (for tests) or create a new one
    const git = (this as any).gitClientService ?? this.gitClientService ?? new GitClientService();

    // Apply each proposal: scan, write and stage
    for (const p of proposals) {
      // run secret scan if available
      try {
        (this as any).secretScanner?.scanContent(p.proposedContent, { filePath: p.filePath });
      } catch (err) {
        this.logger.error('Secret scanner blocked a proposed change: ' + String(err));
        // Bubble up as Forbidden to stop execution
        throw new BadRequestException('Proposed change contains secrets: ' + String(err));
      }

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
      // Before creating PR, scan final combined patch contents for secrets
      try {
        for (const p of proposals) {
          (this as any).secretScanner?.scanContent(p.proposedContent, { filePath: p.filePath });
        }
      } catch (err) {
        this.logger.error('Secret scanner blocked finalization: ' + String(err));
        throw new BadRequestException('Finalization blocked: secrets detected');
      }

      const pr = await gh.createPullRequest(branch, commitMsg, `Automated changes (${proposals.length})`);

      // record last autonomous PR for status/dashboard
      try {
        const repoRoot = path.resolve(__dirname, '../../../..');
        const outPath = path.join(repoRoot, 'LAST_AUTONOMOUS_PR.json');
        const dump = {
          url: pr?.data?.html_url,
          number: pr?.data?.number,
          title: pr?.data?.title,
          branch,
          created_at: pr?.data?.created_at,
        };
        fs.writeFileSync(outPath, JSON.stringify(dump, null, 2), { encoding: 'utf-8' });
      } catch (e) {
        // don't fail finalization if recording fails
        this.logger.warn('Could not record LAST_AUTONOMOUS_PR: ' + String(e));
      }

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
