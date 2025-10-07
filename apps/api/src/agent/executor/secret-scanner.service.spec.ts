import { SecretScannerService } from './secret-scanner.service';
import { BadRequestException } from '@nestjs/common';

describe('SecretScannerService', () => {
  const svc = new SecretScannerService();

  it('allows benign content', () => {
    expect(() => svc.scanContent('This is a harmless README with code examples.')).not.toThrow();
  });

  it('rejects AWS key pattern', () => {
    const key = 'AKIA' + 'A'.repeat(16); // AKIA followed by 16 chars => matches regex
    const content = `Here is a key ${key} that should be detected`;
    expect(() => svc.scanContent(content, { filePath: 'README.md' })).toThrow(BadRequestException);
  });

  it('rejects PEM private key block', () => {
    const pem = `-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqh...lots...\n-----END PRIVATE KEY-----`;
    expect(() => svc.scanContent(pem)).toThrow(BadRequestException);
  });

  it('minimizes false positives for short hex', () => {
    const content = 'short hex: abcdef1234 should NOT trigger';
    expect(() => svc.scanContent(content)).not.toThrow();
  });
});
