import { Controller, Post, Body, UseGuards, BadRequestException } from '@nestjs/common';
import { OpenaiService } from './openai.service';
import { SecretTokenGuard } from '../common/guards/secret-token.guard';

class ChatPromptDto {
  prompt!: string;
  history?: any[];
  model?: string;
}

@Controller('openai')
@UseGuards(SecretTokenGuard)
export class OpenaiController {
  constructor(private readonly openaiService: OpenaiService) {}

  @Post('chat')
  async chat(@Body() body: ChatPromptDto): Promise<{ response: string }> {
    if (!body.prompt || body.prompt.length > 500) {
      throw new BadRequestException('Invalid message');
    }
    const response = await this.openaiService.generateChatCompletion(
      body.prompt,
      body.history,
      body.model,
    );
    return { response };
  }
}
