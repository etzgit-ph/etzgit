import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ConfigService } from '@nestjs/config';

import { MANDATORY_SECURITY_HEADERS } from '@aca/utils';

@Injectable()
export class SecurityHeadersInterceptor implements NestInterceptor {
  private readonly enabled: boolean;
  constructor(private readonly configService: ConfigService) {
    const env = this.configService.get<string>('NODE_ENV') || 'development';
    const strict = this.configService.get<string>('SECURITY_HEADERS_STRICT');
    // default: enabled in production, disabled in development unless explicitly enabled
    this.enabled = strict === 'true' || env === 'production';
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (!this.enabled) return next.handle();

    const ctx = context.switchToHttp();
    const res = ctx.getResponse();
    if (res && typeof res.setHeader === 'function') {
      for (const h of MANDATORY_SECURITY_HEADERS) {
        try {
          res.setHeader(h.key, h.value);
        } catch (e) {
          // ignore if response not available
        }
      }
    }
    return next.handle();
  }
}
