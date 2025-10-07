import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export type SecurityEvent = {
  time: string;
  remote?: string | null;
  path?: string;
  reason: string;
  userAgent?: string | null;
};

@Injectable()
export class SecurityAuditService {
  private readonly logger = new Logger(SecurityAuditService.name);

  logEvent(evt: SecurityEvent) {
    try {
      const repoRoot = path.resolve(__dirname, '../../../..');
      const logsDir = path.join(repoRoot, 'logs');
      try {
        fs.mkdirSync(logsDir, { recursive: true });
      } catch (e) {}
      const out = path.join(logsDir, 'security-events.log');
      const line = JSON.stringify(evt) + '\n';
      fs.appendFileSync(out, line, { encoding: 'utf-8' });
    } catch (e) {
      this.logger.warn('Failed to write security event: ' + String(e));
    }
  }
}
