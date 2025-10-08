export interface SecretsUpdateDto {
  openaiApiKey: string;
  githubPat: string;
  environment: 'dev' | 'staging' | 'prod';
}

export default SecretsUpdateDto;
