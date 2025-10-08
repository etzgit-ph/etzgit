import { GitClientService } from './git-client.service';
import * as fs from 'fs';
import * as path from 'path';

describe('GitClientService read/write security', () => {
  const service = new GitClientService();
  const tmpDir = path.resolve(__dirname, '..', 'tmp-test-files');
  const allowedFile = path.join(tmpDir, 'allowed.txt');

  beforeAll(() => {
    try {
      fs.mkdirSync(tmpDir, { recursive: true });
    } catch (e) {}
    fs.writeFileSync(allowedFile, 'initial', { encoding: 'utf-8' });
  });

  afterAll(() => {
    try {
      fs.unlinkSync(allowedFile);
      fs.rmdirSync(tmpDir);
    } catch (e) {}
  });

  it('can read a file inside modifiable path', () => {
    // debug check for path allowance
    // @ts-ignore access private
    const allowedCheck = (service as any).isPathAllowed(allowedFile);
    // ensure our assumption holds
    expect(allowedCheck).toBe(true);
    const content = service.readFile(allowedFile);
    expect(content).toBe('initial');
  });

  it('can write a file inside modifiable path', () => {
    // @ts-ignore
    const allowedCheck = (service as any).isPathAllowed(allowedFile);
    expect(allowedCheck).toBe(true);
    service.writeFile(allowedFile, 'changed');
    const content = fs.readFileSync(allowedFile, { encoding: 'utf-8' });
    expect(content).toBe('changed');
  });

  it('throws when attempting to read outside allowed paths', () => {
    expect(() =>
      service.readFile(path.resolve(__dirname, '..', '..', '..', 'package.json')),
    ).toThrow();
  });

  it('throws when attempting to write outside allowed paths', () => {
    expect(() =>
      service.writeFile(path.resolve(__dirname, '..', '..', '..', 'package.json'), 'x'),
    ).toThrow();
  });
});
