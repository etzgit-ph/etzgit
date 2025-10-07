import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { z } from 'zod';
import { AgentModule } from './agent/agent.module';
import { SystemModule } from './system/system.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { SecurityHeadersInterceptor } from './common/interceptors/security-headers.interceptor';
import { SecretTokenGuard } from './common/guards/secret-token.guard';
import { SecurityAuditService } from './common/services/security-audit.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: z
        .object({
          GITHUB_TOKEN: z.string().min(1),
          LLM_API_KEY: z.string().min(1),
        })
        .parse(process.env as Record<string, unknown>),
    }),
  AgentModule,
  SystemModule,
  ],
  controllers: [],
  providers: [LoggingInterceptor, SecurityHeadersInterceptor, SecretTokenGuard, SecurityAuditService],
})
export class AppModule {}
