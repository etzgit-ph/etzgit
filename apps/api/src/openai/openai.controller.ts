import { Controller, Post, Body, UseGuards, HttpCode } from '@nestjs/common';
import { OpenaiService } from './openai.service';
import { OpenaiCommandRouterService } from './openai-command-router.service';
import { ApproveProposalDto } from './dto/approve-proposal.dto';
import StructuredCommandDto from './dto/structured-command.dto';
import { AuthGuard } from '../common/guards/auth.guard';

@Controller('openai')
export class OpenaiController {
  constructor(
    private readonly openaiService: OpenaiService,
    private readonly routerService: OpenaiCommandRouterService,
  ) {}

  @Post('chat')
  // @UseGuards(AuthGuard) // Uncomment to enforce authentication
  @HttpCode(201)
  async chat(@Body('prompt') prompt: string): Promise<string> {
    // Input validation should be added here for production
    return await this.openaiService.generateChatCompletion(prompt);
  }

  @Post('approve-proposal')
  @UseGuards(AuthGuard)
  @HttpCode(200)
  async approveProposal(@Body() dto: ApproveProposalDto): Promise<{ success: boolean; branch?: string }>
  {
    // call the router service which handles the approved workflow
    const res = await this.routerService.approveProposal(dto.id, dto.path, dto.newContent);
    return { success: true, branch: res?.branch };
  }

  @Post('command')
  @UseGuards(AuthGuard)
  @HttpCode(200)
  async routeStructuredCommand(@Body() dto: StructuredCommandDto): Promise<any> {
    // Basic validation
    if (!dto || !dto.type || !dto.target || !dto.action) {
      return { success: false, message: 'invalid payload' };
    }

    // Let the router service translate structured command into a prompt and call the OpenAI tools
    const result = await this.routerService.routeStructuredCommand(dto as any);
    // If the router processed a tool call, it will return a ProposalResponse; forward that.
    if (result) return result;
    return { success: true };
  }
}
