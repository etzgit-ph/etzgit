import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { OpenAISchema } from './config/schemas/openai.schema';
import { AgentModule } from './agent/agent.module';
import { SystemModule } from './system/system.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { SecurityHeadersInterceptor } from './common/interceptors/security-headers.interceptor';
import { SecretTokenGuard } from './common/guards/secret-token.guard';
import { SecurityAuditService } from './common/services/security-audit.service';
import { OpenaiModule } from './openai/openai.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: OpenAISchema,
      validationOptions: {
        abortEarly: false,
      },
    }),
    AgentModule,
    SystemModule,
    OpenaiModule,
  ],
  controllers: [],
  providers: [
    LoggingInterceptor,
    SecurityHeadersInterceptor,
    SecretTokenGuard,
    SecurityAuditService,
  ],
})
export class AppModule {}
