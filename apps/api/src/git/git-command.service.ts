import { Injectable, BadRequestException } from '@nestjs/common';

type SimpleGit = any;

@Injectable()
export class GitCommandService {
  private git: SimpleGit;
  private protectedPaths = [
    '.git',
    '.github',
    'package.json',
    'pnpm-lock.yaml',
    'pnpm-workspace.yaml',
    'package-lock.json',
    'yarn.lock',
  ];

  // Initialize git client at runtime. Tests can inject a mock via setGitClient().
  constructor() {
    let sg: any = null;
    try {
      // require at runtime to avoid ESM/loader issues during tests
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const simpleGit = require('simple-git');
      sg = simpleGit;
    } catch (err) {
      sg = null;
    }
    this.git = sg ? sg() : (null as unknown as SimpleGit);
  }

  // Allow tests to inject a fake git client
  setGitClient(gitClient: any) {
    this.git = gitClient;
  }

  private isValidBranchName(name: string): boolean {
    if (!name || typeof name !== 'string') return false;
    if (name.length > 255) return false;
  // disallow control chars, whitespace, and the common forbidden chars used by git
  if (/[\x00-\x1f\x7f\s~^:?*\\\[\]]/.test(name)) return false;
    if (name.includes('..')) return false;
    if (name.endsWith('.lock')) return false;
    if (name.startsWith('/') || name.endsWith('/')) return false;
    if (name.endsWith('.')) return false;
    if (name.startsWith('-')) return false;
    return true;
  }

  private isProtectedPath(path: string): boolean {
    if (!path) return false;
    const normalized = path.replace(/\\/g, '/');
    return this.protectedPaths.some((p) => normalized === p || normalized.startsWith(p + '/'));
  }

  private validateFilePath(path: string): void {
    if (!path || typeof path !== 'string') throw new BadRequestException('Invalid path');
    if (path.includes('..')) throw new BadRequestException('Path traversal not allowed');
    if (path.startsWith('/') || path.startsWith('\\')) throw new BadRequestException('Absolute paths not allowed');
    if (this.isProtectedPath(path)) throw new BadRequestException('Operation on protected path is not allowed');
  }

  async checkoutBranch(name: string): Promise<void> {
    if (!this.isValidBranchName(name)) {
      throw new BadRequestException('Invalid branch name');
    }
    const safe = name;
    try {
      await this.git.checkoutLocalBranch(safe);
    } catch (err) {
      const e: any = err;
      throw new Error(`Failed to checkout branch ${safe}: ${e?.message ?? e}`);
    }
  }

  async commitFile(path: string, message: string): Promise<void> {
    this.validateFilePath(path);
    if (!message) throw new BadRequestException('Commit message required');
    try {
      await this.git.add(path);
      await this.git.commit(message, path);
    } catch (err) {
      const e: any = err;
      throw new Error(`Git commit failed for ${path}: ${e?.message ?? e}`);
    }
  }

  async pushBranch(branchName: string): Promise<void> {
    if (!this.isValidBranchName(branchName)) {
      throw new BadRequestException('Invalid branch name');
    }
    try {
      // git.push(['--set-upstream', 'origin', branchName]) via simple-git
      if (typeof this.git.push === 'function') {
        await this.git.push(['--set-upstream', 'origin', branchName]);
      } else if (this.git.raw) {
        await this.git.raw(['push', '--set-upstream', 'origin', branchName]);
      } else {
        throw new Error('Git client does not support push');
      }
    } catch (err) {
      const e: any = err;
      throw new Error(`Git push failed for ${branchName}: ${e?.message ?? e}`);
    }
  }
}
