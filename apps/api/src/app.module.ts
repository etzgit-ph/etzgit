import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { z } from 'zod';
import { OpenAISchema } from './config/schemas/openai.schema';
import { AgentModule } from './agent/agent.module';
import { SystemModule } from './system/system.module';
import { DiagnosticsModule } from './diagnostics/diagnostics.module';
import { SecretsModule } from './secrets/secrets.module';
import { SecretsController } from './secrets/secrets.controller';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { SecurityHeadersInterceptor } from './common/interceptors/security-headers.interceptor';
import { SecretTokenGuard } from './common/guards/secret-token.guard';
import { AuthGuard } from './common/guards/auth.guard';
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
        .merge(OpenAISchema)
        .parse(process.env as Record<string, unknown>),
    }),
    AgentModule,
    SystemModule,
  DiagnosticsModule,
    SecretsModule,
  ],
  controllers: [SecretsController],
  providers: [
    LoggingInterceptor,
    SecurityHeadersInterceptor,
    SecretTokenGuard,
    AuthGuard,
    SecurityAuditService,
  ],
})
export class AppModule {}
