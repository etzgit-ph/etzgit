import { Injectable, ForbiddenException } from '@nestjs/common';
import { execFileSync } from 'child_process';
import * as path from 'path';
import { MODIFIABLE_PATHS } from '@aca/utils';
import { writeFileSync, readFileSync } from 'fs';

@Injectable()
export class GitClientService {
  runGitStatus(): string {
    return execFileSync('git', ['status', '--short'], { encoding: 'utf-8' });
  }

  private isPathAllowed(targetPath: string): boolean {
    const resolved = path.resolve(targetPath);
    // Determine repository root based on this file's location: ../../../.. from apps/api/src/git
    const repoRoot = path.resolve(__dirname, '../../../..');
    return MODIFIABLE_PATHS.some((allowed) => {
      const allowedResolved = path.resolve(repoRoot, allowed);
      if (resolved === allowedResolved) return true;
      const prefix = allowedResolved.endsWith(path.sep) ? allowedResolved : allowedResolved + path.sep;
      return resolved.startsWith(prefix);
    });
  }

  readFile(targetPath: string): string {
    if (!this.isPathAllowed(targetPath)) {
      throw new ForbiddenException('Path not allowed');
    }
    return readFileSync(path.resolve(targetPath), { encoding: 'utf-8' });
  }

  writeFile(targetPath: string, content: string): void {
    if (!this.isPathAllowed(targetPath)) {
      throw new ForbiddenException('Path not allowed');
    }
    writeFileSync(path.resolve(targetPath), content, { encoding: 'utf-8' });
  }

  gitCommit(message: string): void {
    // Enforce commit message format: [AUTONOMOUS]: <type>(scope): <description>
    const re = /^\[AUTONOMOUS\]:\s+\w+(?:\([^)]+\))?:\s+.+$/;
    if (!re.test(message)) {
      throw new Error('Commit message does not follow autonomous format');
    }
    execFileSync('git', ['add', '-A']);
    execFileSync('git', ['commit', '-m', message]);
  }

  gitCreateBranch(name: string): void {
    execFileSync('git', ['checkout', '-b', name]);
  }

  gitDeleteLocalBranch(name: string, force = false): void {
    const args = ['branch', force ? '-D' : '-d', name];
    execFileSync('git', args);
  }

  gitStageFile(targetPath: string): void {
    const resolved = path.resolve(targetPath);
    execFileSync('git', ['add', resolved]);
  }

  runTests(command = 'pnpm test --no-coverage'): { success: boolean; output: string } {
    try {
      const out = execFileSync(command.split(' ')[0], command.split(' ').slice(1), { encoding: 'utf-8' });
      return { success: true, output: out };
    } catch (err: any) {
      return { success: false, output: err?.message || String(err) };
    }
  }

  gitRollback(): void {
    execFileSync('git', ['reset', '--hard', 'HEAD']);
  }
}
