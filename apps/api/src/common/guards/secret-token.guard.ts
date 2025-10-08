import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { SecurityAuditService } from '../services/security-audit.service';

@Injectable()
export class SecretTokenGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService,
    private readonly audit: SecurityAuditService,
  ) {}

  private extractTokenFromRequest(req: any): string | undefined {
    // support multiple header names
    const headers = req.headers || {};
    const raw =
      headers['x-agent-secret-key'] ||
      headers['x-agent-secret'] ||
      headers['x-agent-secret-key'.toLowerCase()];
    if (raw) return String(raw);

    // also support Authorization: Bearer <token>
    const auth = headers['authorization'] || headers['Authorization'];
    if (auth && typeof auth === 'string') {
      const m = auth.match(/^Bearer\s+(.+)$/i);
      if (m) return m[1];
    }

    return undefined;
  }

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const token = this.extractTokenFromRequest(req);
    const expected = this.configService.get<string>('AGENT_RUN_SECRET');

    if (!expected) {
      // If no secret configured, deny by default for safety
      this.audit.logEvent({
        time: new Date().toISOString(),
        path: req.url,
        reason: 'no-secret-configured',
        remote: req.ip || null,
        userAgent: req.headers['user-agent'] || null,
      });
      throw new UnauthorizedException('Agent run secret not configured');
    }

    if (!token) {
      this.audit.logEvent({
        time: new Date().toISOString(),
        path: req.url,
        reason: 'missing-token',
        remote: req.ip || null,
        userAgent: req.headers['user-agent'] || null,
      });
      throw new UnauthorizedException('Invalid agent secret');
    }

    // constant-time comparison
    try {
      const a = Buffer.from(token);
      const b = Buffer.from(expected);
      if (a.length !== b.length) {
        this.audit.logEvent({
          time: new Date().toISOString(),
          path: req.url,
          reason: 'length-mismatch',
          remote: req.ip || null,
          userAgent: req.headers['user-agent'] || null,
        });
        throw new UnauthorizedException('Invalid agent secret');
      }
      if (!crypto.timingSafeEqual(a, b)) {
        this.audit.logEvent({
          time: new Date().toISOString(),
          path: req.url,
          reason: 'timing-compare-failed',
          remote: req.ip || null,
          userAgent: req.headers['user-agent'] || null,
        });
        throw new UnauthorizedException('Invalid agent secret');
      }
    } catch (e) {
      if (e instanceof UnauthorizedException) throw e;
      this.audit.logEvent({
        time: new Date().toISOString(),
        path: req.url,
        reason: 'compare-error',
        remote: req.ip || null,
        userAgent: req.headers['user-agent'] || null,
      });
      throw new UnauthorizedException('Invalid agent secret');
    }

    return true;
  }
}
