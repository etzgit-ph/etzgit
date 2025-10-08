import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { hasSecrets } from '@aca/utils';

@Injectable()
export class SecretScannerService {
  private readonly logger = new Logger(SecretScannerService.name);

  scanContent(content: string, context?: { filePath?: string }): void {
    const res = hasSecrets(content);
    if (res.found) {
      const detail = res.findings.map((f) => `${f.pattern}@${f.index}`).join(', ');
      this.logger.warn(
        `Secret scanner rejected content for ${context?.filePath || 'unknown'}: ${detail}`,
      );
      throw new BadRequestException(`Secret content detected: ${detail}`);
    }
  }
}
