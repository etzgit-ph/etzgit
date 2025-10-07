import { Injectable } from '@nestjs/common';
import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class SystemService {
  getVersion(): string | undefined {
    try {
      const p = path.resolve(__dirname, '../../../VERSION.txt');
      if (fs.existsSync(p)) return fs.readFileSync(p, { encoding: 'utf-8' }).trim();
    } catch (e) {}
    return undefined;
  }

  getCommitHash(): string | undefined {
    try {
      const out = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf-8' }).trim();
      return out;
    } catch (e) {
      return undefined;
    }
  }

  getStatus() {
    const repoRoot = path.resolve(__dirname, '../../../..');
    let lastPr: any = undefined;
    try {
      const p = path.join(repoRoot, 'LAST_AUTONOMOUS_PR.json');
      if (fs.existsSync(p)) lastPr = JSON.parse(fs.readFileSync(p, { encoding: 'utf-8' }));
    } catch (e) {}

    let clean: boolean | undefined = undefined;
    try {
      const out = execFileSync('git', ['status', '--porcelain'], { encoding: 'utf-8' });
      clean = out.trim().length === 0;
    } catch (e) {
      clean = undefined;
    }

    return {
      version: this.getVersion(),
      commitHash: this.getCommitHash(),
      uptime: process.uptime(),
      lastAutonomousPR: lastPr,
      repoClean: clean,
    };
  }
}
