import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { SecretTokenGuard } from './secret-token.guard';
import { SecurityAuditService } from '../services/security-audit.service';
import jwt from 'jsonwebtoken';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly config: ConfigService,
    @Optional() private readonly secretGuard: SecretTokenGuard,
    private readonly audit: SecurityAuditService,
  ) {}

  private extractBearer(req: any): string | undefined {
    const headers = req.headers || {};
    const auth = headers['authorization'] || headers['Authorization'];
    if (auth && typeof auth === 'string') {
      const m = auth.match(/^Bearer\s+(.+)$/i);
      if (m) return m[1];
    }
    return undefined;
  }

  private base64UrlDecode(input: string): string {
    // replace url-safe chars
    input = input.replace(/-/g, '+').replace(/_/g, '/');
    // pad
    while (input.length % 4) input += '=';
    return Buffer.from(input, 'base64').toString('utf8');
  }

  private verifyHmacSha256(data: string, signatureB64Url: string, secret: string): boolean {
    const sig = crypto.createHmac('sha256', secret).update(data).digest();
    const provided = Buffer.from(signatureB64Url.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
    if (sig.length !== provided.length) return false;
    return crypto.timingSafeEqual(sig, provided);
  }

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();

    // First, try the existing secret-based guard if it's available. If it passes, we're done.
    try {
      if (this.secretGuard && typeof this.secretGuard.canActivate === 'function') {
        try {
          if (this.secretGuard.canActivate(context)) return true;
        } catch (e) {
          // if SecretTokenGuard rejected, fall through to other checks
        }
      } else {
        // secret guard not provided in this testing module; perform a local secret check
        const tokenCandidate = this.extractBearer(req) || this.extractBearer(req) || undefined;
        const expected = this.config.get<string>('AGENT_RUN_SECRET');
        if (expected && tokenCandidate) {
          try {
            const a = Buffer.from(tokenCandidate);
            const b = Buffer.from(expected);
            if (a.length === b.length && crypto.timingSafeEqual(a, b)) {
              return true;
            }
          } catch (e) {
            // ignore and continue to JWT
          }
        }
      }
    } catch (e) {
      // fall through to JWT verification
    }

    // Try standard JWT verification using jsonwebtoken and AGENT_JWT_SECRET
    const token = this.extractBearer(req);
    const jwtSecret = this.config.get<string>('AGENT_JWT_SECRET');

    if (!jwtSecret) {
      this.audit.logEvent({
        time: new Date().toISOString(),
        path: req.url,
        reason: 'no-jwt-secret-configured',
        remote: req.ip || null,
        userAgent: req.headers['user-agent'] || null,
      });
      throw new UnauthorizedException('No agent auth configured');
    }

    if (!token) {
      this.audit.logEvent({
        time: new Date().toISOString(),
        path: req.url,
        reason: 'missing-bearer-token',
        remote: req.ip || null,
        userAgent: req.headers['user-agent'] || null,
      });
      throw new UnauthorizedException('Invalid agent credentials');
    }

    let payloadJson: any;
    try {
      // verify will throw if invalid/expired
      payloadJson = jwt.verify(token, jwtSecret) as any;
    } catch (e: any) {
      this.audit.logEvent({
        time: new Date().toISOString(),
        path: req.url,
        reason: 'jwt-verify-failed',
        remote: req.ip || null,
        userAgent: req.headers['user-agent'] || null,
      });
      throw new UnauthorizedException('Invalid token');
    }

    // Accept if roles includes 'agent' or 'admin'
    const roles: string[] = payloadJson.roles || [];
    if (Array.isArray(roles) && (roles.includes('agent') || roles.includes('admin'))) {
      (req as any).user = payloadJson;
      return true;
    }

    // Also accept scope claim as space-separated string
    if (typeof payloadJson.scope === 'string') {
      const partsScope = payloadJson.scope.split(/\s+/);
      if (partsScope.includes('agent') || partsScope.includes('admin')) {
        (req as any).user = payloadJson;
        return true;
      }
    }

    this.audit.logEvent({
      time: new Date().toISOString(),
      path: req.url,
      reason: 'jwt-missing-required-role',
      remote: req.ip || null,
      userAgent: req.headers['user-agent'] || null,
    });
    throw new UnauthorizedException('Insufficient token scope');
  }
}
