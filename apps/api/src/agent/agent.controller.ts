import { Controller, Post, HttpCode, UseGuards } from '@nestjs/common';
import { AgentService } from './agent.service';
import { AuthGuard } from '../common/guards/auth.guard';

@Controller('api/v1')
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Post('run-agent')
  @UseGuards(AuthGuard)
  @HttpCode(200)
  async run() {
    await this.agentService.runAutonomousUpgrade();
    return { status: 'ok' };
  }
}
