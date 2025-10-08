import { SecretsProvider } from './secrets-provider.interface';

export class AwsSecretsProvider implements SecretsProvider {
  async updateSecrets(dto: any) {
    // TODO: Implement AWS Secrets Manager write
    return false;
  }

  async getSecrets(env: string = 'dev') {
    // TODO: Implement AWS Secrets Manager read
    return null;
  }
}
