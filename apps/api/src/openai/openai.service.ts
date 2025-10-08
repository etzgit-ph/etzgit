import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAI } from 'openai';

@Injectable()
export class OpenaiService {
  private readonly openai: OpenAI;
  private readonly logger = new Logger(OpenaiService.name);

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    this.openai = new OpenAI({ apiKey });
  }

  async generateChatCompletion(
    prompt: string,
    history: any[] = [],
    model?: string,
  ): Promise<string> {
    const SYSTEM_PROMPT =
      'You are a helpful and witty technical assistant. Your answers must be concise and formatted using Markdown.';
    const modelName =
      model ?? this.configService.get<string>('OPENAI_DEFAULT_MODEL') ?? 'gpt-4o-mini';
    if (!modelName) {
      this.logger.error('Model name is missing');
      throw new InternalServerErrorException('OpenAI model name is not configured');
    }
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history,
      { role: 'user', content: prompt },
    ];
    try {
      const response = await this.openai.chat.completions.create({
        model: modelName,
        messages,
        temperature: 0.7,
      });
      return response.choices[0]?.message?.content || "I couldn't generate a response.";
    } catch (error) {
      this.logger.error('OpenAI API error', error);
      throw new InternalServerErrorException(
        'An error occurred while communicating with the AI service.',
      );
    }
  }
}
