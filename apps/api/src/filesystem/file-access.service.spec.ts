import { FileAccessService } from './file-access.service';
import { FileNotFoundException } from './file-not-found.exception';
import * as fs from 'fs';

describe('FileAccessService', () => {
  let service: FileAccessService;

  beforeEach(() => {
    service = new FileAccessService();
  });

  it('reads an existing file (package.json) successfully', async () => {
    const content = await service.readFile('package.json');
    expect(content).toContain('name');
  });

  it('throws FileNotFoundException for non-existent file', async () => {
    await expect(service.readFile('this-file-does-not-exist.txt')).rejects.toThrow(FileNotFoundException);
  });

  it('rejects path traversal attempts', async () => {
    await expect(service.readFile('../package.json')).rejects.toThrow(FileNotFoundException);
  });

  it('can write and read a file atomically', async () => {
  const testPath = 'apps/api/src/temp-test-write.txt';
    const payload = 'hello atomic';
    await service.writeFile(testPath, payload);
    const read = await service.readFile(testPath);
    expect(read).toBe(payload);
  });
});
