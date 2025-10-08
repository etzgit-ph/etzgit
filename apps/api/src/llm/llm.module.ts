import { Module } from '@nestjs/common';
import { LLMService } from './llm.service';
import { LLMController } from './llm.controller';

@Module({
  providers: [LLMService],
  controllers: [LLMController],
  exports: [LLMService],
})
export class LLMModule {}
