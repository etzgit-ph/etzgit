import { Module, Provider } from '@nestjs/common';
import { SecretsService } from './secrets.service';
import { LocalFileSecretsProvider } from './providers/local-file.provider';
import { AwsSecretsProvider } from './providers/aws.provider';
import { ConfigService } from '@nestjs/config';

const SECRETS_PROVIDER_FACTORY: Provider = {
	provide: 'SECRETS_PROVIDER',
	useFactory: () => {
		const which = (process.env.AGENT_SECRETS_PROVIDER || 'local').toLowerCase();
		if (which === 'aws') return new AwsSecretsProvider();
		return new LocalFileSecretsProvider();
	},
};

@Module({ providers: [SecretsService, SECRETS_PROVIDER_FACTORY], exports: [SecretsService] })
export class SecretsModule {}
