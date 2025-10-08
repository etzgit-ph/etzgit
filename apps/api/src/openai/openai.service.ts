import { Injectable, InternalServerErrorException, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAI } from 'openai';
import { SecretsService } from '../secrets/secrets.service';

@Injectable()
export class OpenaiService {
  private readonly openai: OpenAI;
  private readonly logger = new Logger(OpenaiService.name);
  private readonly defaultModel: string;

  constructor(private readonly configService: ConfigService, @Optional() private readonly secretsService?: SecretsService) {
    const fallbackKey = this.configService.get<string>('OPENAI_API_KEY');
    this.defaultModel = this.configService.get<string>('OPENAI_DEFAULT_MODEL') || 'gpt-3.5-turbo';

    // Try to load from SecretsService first (local file mock). If it is synchronous, use it; otherwise fall back to env.
    let apiKey = fallbackKey;
    try {
      if (this.secretsService && typeof this.secretsService.getSecrets === 'function') {
        // Call getSecrets but only accept synchronous result for initialization.
        const maybe = this.secretsService.getSecrets('dev');
        if (!(maybe && typeof (maybe as any).then === 'function')) {
          const resolved = maybe as any;
          apiKey = resolved?.openaiApiKey || fallbackKey;
        }
      }
    } catch (err) {
      apiKey = fallbackKey;
    }

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
