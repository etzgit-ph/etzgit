import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAI } from 'openai';

@Injectable()
export class OpenaiService {
  private readonly openai: OpenAI;
  private readonly logger = new Logger(OpenaiService.name);
  private readonly defaultModel: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    this.defaultModel = this.configService.get<string>('OPENAI_DEFAULT_MODEL') || 'gpt-3.5-turbo';
    this.openai = new OpenAI({ apiKey });
  }

  async generateChatCompletion(prompt: string, model?: string): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: model || this.defaultModel,
        messages: [{ role: 'user', content: prompt }],
      });
      this.logger.log(`OpenAI response: ${JSON.stringify(response)}`);
      return response.choices[0]?.message?.content || '';
    } catch (error) {
      this.logger.error('OpenAI API error', error);
      throw new InternalServerErrorException('Failed to generate chat completion');
    }
  }
}
