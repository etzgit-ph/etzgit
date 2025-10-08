import { Injectable, Logger, Inject, Optional } from '@nestjs/common';
import { SecretsUpdateDto } from '../../../../packages/shared-types/src/secrets';
import { SecretsProvider } from './providers/secrets-provider.interface';
import { LocalFileSecretsProvider } from './providers/local-file.provider';

@Injectable()
export class SecretsService {
  private readonly logger = new Logger(SecretsService.name);
  private provider: SecretsProvider;

  constructor(@Optional() @Inject('SECRETS_PROVIDER') provider?: SecretsProvider) {
    // Use injected provider or default to local-file provider
    this.provider = provider || new LocalFileSecretsProvider();
  }

  async updateSecrets(dto: SecretsUpdateDto) {
    const ok = await this.provider.updateSecrets(dto as any);
    if (ok) this.logger.log(`Updated secrets for env=${dto.environment}`);
    else this.logger.error('Failed to update secrets via provider');
    return ok;
  }

  async getSecrets(environment: 'dev' | 'staging' | 'prod' = 'dev') {
    try {
      return await this.provider.getSecrets(environment);
    } catch (err) {
      this.logger.error('Failed to read secrets from provider', err as any);
      return null;
    }
  }
}
