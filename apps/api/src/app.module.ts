import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { z } from 'zod';
import { AgentModule } from './agent/agent.module';

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
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
