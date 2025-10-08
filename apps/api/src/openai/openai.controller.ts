import { Controller, Post, Body, UseGuards, HttpCode } from '@nestjs/common';
import { OpenaiService } from './openai.service';
// import { AuthGuard } from '../common/guards/auth.guard'; // Uncomment if you have an AuthGuard

@Controller('openai')
export class OpenaiController {
  constructor(private readonly openaiService: OpenaiService) {}

  @Post('chat')
  // @UseGuards(AuthGuard) // Uncomment to enforce authentication
  @HttpCode(201)
  async chat(@Body('prompt') prompt: string): Promise<string> {
    // Input validation should be added here for production
    return await this.openaiService.generateChatCompletion(prompt);
  }
}
