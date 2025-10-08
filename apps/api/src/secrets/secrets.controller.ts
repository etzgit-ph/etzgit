import { Body, Controller, Post, UseGuards, UnauthorizedException } from '@nestjs/common';
import { SecretsService } from './secrets.service';
import { SecretsUpdateDto } from '../../../../packages/shared-types/src/secrets';
import { AuthGuard } from '../common/guards/auth.guard';

@Controller('api/secrets')
export class SecretsController {
  constructor(private readonly secretsService: SecretsService) {}

  @Post()
  @UseGuards(AuthGuard)
  async update(@Body() body: SecretsUpdateDto) {
    // Basic runtime validation
    if (!body || !body.openaiApiKey || !body.githubPat || !['dev', 'staging', 'prod'].includes(body.environment)) {
      throw new UnauthorizedException('Invalid payload');
    }

    const ok = await this.secretsService.updateSecrets(body as SecretsUpdateDto);
    return { success: !!ok };
  }
}
