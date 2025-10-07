import { Controller, Post, HttpCode, UseGuards } from '@nestjs/common';
import { AgentService } from './agent.service';
import { SecretTokenGuard } from '../common/guards/secret-token.guard';

@Controller('api/v1')
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Post('run-agent')
  @UseGuards(SecretTokenGuard)
  @HttpCode(200)
  async run() {
    await this.agentService.runAutonomousUpgrade();
    return { status: 'ok' };
  }
}
