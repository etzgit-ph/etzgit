import { GitClientService } from './git-client.service';
import { ProtectedPathModificationError } from '@aca/exceptions';
import * as path from 'path';

describe('GitClientService', () => {
  it('should mock git status', () => {
    const service = new GitClientService();
    // Use Jest spy for the Jest test runner
    jest.spyOn(service, 'runGitStatus').mockReturnValue('M file.txt');
    expect(service.runGitStatus()).toBe('M file.txt');
  });

  it('should reject path traversal attempts for readFile', () => {
    const service = new GitClientService();
    const attempt = '../../.env';
    expect(() => service.readFile(attempt)).toThrow(ProtectedPathModificationError);
  });

  it('should reject absolute protected paths for writeFile', () => {
    const service = new GitClientService();
    const attempt = path.resolve('/etc/passwd');
    expect(() => service.writeFile(attempt, 'data')).toThrow(ProtectedPathModificationError);
  });

  it('should reject modifications to files in PROTECTED_PATHS', () => {
    const service = new GitClientService();
    // Use one of the protected paths defined in constants
    const protectedFile = path.resolve(__dirname, '../../../..', 'SECURITY.md');
    expect(() => service.writeFile(protectedFile, 'tamper')).toThrow(ProtectedPathModificationError);
  });
});
