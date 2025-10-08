export interface SecretsProvider {
  updateSecrets(dto: any): Promise<boolean>;
  getSecrets(env?: string): Promise<any | null>;
}
