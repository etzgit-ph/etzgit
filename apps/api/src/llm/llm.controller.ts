import { Controller, Post, Body, UseGuards, Inject, NotFoundException } from '@nestjs/common';
import { LLMService } from './llm.service';
import { PatchRequestDTO } from '@aca/shared-types';
import { SecretTokenGuard } from '../common/guards/secret-token.guard';
import { ConfigService } from '@nestjs/config';

@Controller('llm')
export class LLMController {
  constructor(private readonly llm: LLMService, private readonly config: ConfigService) {}

  // Demo endpoint: returns proposed patches from the LLM (dry-run only)
  @UseGuards(SecretTokenGuard)
  @Post('demo')
  async demo(@Body() req: PatchRequestDTO) {
    const enabled = this.config.get<boolean>('LLM_DEMO_ENABLED');
    if (!enabled) {
      // feature flag off in this environment
      throw new NotFoundException();
    }

    // LLMService already enforces throttling internally; call it
    const proposals = await this.llm.generatePatch(req);
    return { proposals };
  }
}
