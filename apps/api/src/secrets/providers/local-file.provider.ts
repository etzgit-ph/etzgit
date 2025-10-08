import { SecretsProvider } from './secrets-provider.interface';
import fs from 'fs';
import path from 'path';

const SECRETS_FILE = path.resolve(process.cwd(), '.local', 'secrets.json');

export class LocalFileSecretsProvider implements SecretsProvider {
  async updateSecrets(dto: any) {
    try {
      await fs.promises.mkdir(path.dirname(SECRETS_FILE), { recursive: true });
      await fs.promises.writeFile(SECRETS_FILE, JSON.stringify(dto, null, 2), { mode: 0o600 });
      return true;
    } catch (e) {
      return false;
    }
  }

  async getSecrets(env: string = 'dev') {
    try {
      if (!fs.existsSync(SECRETS_FILE)) return null;
      const raw = await fs.promises.readFile(SECRETS_FILE, 'utf-8');
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }
}
