import { Injectable, Logger } from '@nestjs/common';
import { PatchRequestDTO } from '@aca/shared-types';
import * as fs from 'fs';
import * as path from 'path';
import { MODIFIABLE_PATHS, PROTECTED_PATHS } from '@aca/utils';
import { GitClientService } from '../../git/git-client.service';

const DEFAULT_MAX_FILES = 50;

@Injectable()
export class PlannerService {
  private readonly logger = new Logger(PlannerService.name);
  constructor(
    private readonly gitClientService?: GitClientService,
    private readonly maxFiles = DEFAULT_MAX_FILES,
  ) {}

  async determineNextAction(): Promise<PatchRequestDTO[]> {
    try {
      const repoRoot = path.resolve(__dirname, '../../../..');
      const files: string[] = [];

      for (const mod of MODIFIABLE_PATHS) {
        const base = path.resolve(repoRoot, mod);
        if (!fs.existsSync(base)) continue;
        this.collectFiles(base, files, this.maxFiles);
      }

      const proposals: PatchRequestDTO[] = [];
      const git = (this as any).gitClientService ?? this.gitClientService ?? new GitClientService();

      for (const f of files) {
        // ensure not in protected paths
        const rel = path.relative(repoRoot, f);
        if (PROTECTED_PATHS.some((p) => rel === p || rel.startsWith(p))) {
          this.logger.warn('Skipping protected path: ' + rel);
          continue;
        }

        let content = '';
        try {
          content = git.readFile(f);
        } catch (e) {
          // fallback to fs read (best-effort)
          try {
            content = fs.readFileSync(f, { encoding: 'utf-8' });
          } catch (err) {
            continue;
          }
        }

        const goal = this.buildGoalForFile(rel, content);
        proposals.push({ filePath: rel, currentContent: content, goal });
      }

      if (proposals.length === 0) {
        // safe default
        return [
          {
            filePath: 'README.md',
            currentContent: '',
            goal: 'Ensure README contains project version',
          },
        ];
      }

      return proposals;
    } catch (err) {
      this.logger.error('Planner failed: ' + String(err));
      return [
        {
          filePath: 'README.md',
          currentContent: '',
          goal: 'Ensure README contains project version',
        },
      ];
    }
  }

  private collectFiles(dir: string, out: string[], max: number) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      if (out.length >= max) return;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        // skip node_modules and .git
        if (e.name === 'node_modules' || e.name === '.git') continue;
        this.collectFiles(full, out, max);
      } else if (e.isFile()) {
        out.push(full);
        if (out.length >= max) return;
      }
    }
  }

  private buildGoalForFile(filePath: string, content: string): string {
    // Keep the prompt concise but informative. The LLM should return a JSON array matching UpgradeProposalDTO.
    const mission =
      'You are an autonomous code maintenance assistant. Your mission is to safely propose minimal, well-justified code or documentation changes that improve correctness, security, or dependencies.';
    const constraints = `Constraints:\n- Only propose changes inside the repository paths the agent is allowed to modify: ${MODIFIABLE_PATHS.join(', ')}.\n- Never modify or propose changes to protected paths: ${PROTECTED_PATHS.join(', ')}.\n- Avoid large refactors; prefer small, incremental changes.\n- Do not include secrets or private keys in proposed content.`;
    const format =
      'Output format: Respond ONLY with a JSON array of objects matching UpgradeProposalDTO: [{"filePath": string, "proposedContent": string, "rationale": string}].';
    const context = `File: ${filePath}\nExcerpt:\n${content.slice(0, 1000)}\n---`;

    return [mission, constraints, format, context].join('\n\n');
  }
}
