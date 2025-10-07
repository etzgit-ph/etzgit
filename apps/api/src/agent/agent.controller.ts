import { Controller, Post, HttpCode } from '@nestjs/common';
import { AgentService } from './agent.service';

@Controller('api/v1')
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Post('run-agent')
  @HttpCode(200)
  async run() {
    await this.agentService.runAutonomousUpgrade();
    return { status: 'ok' };
  }
}
