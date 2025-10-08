import { Injectable } from '@nestjs/common';
import { resolve, dirname } from 'path';
import { readFile, writeFile, mkdir, rename, copyFile, unlink } from 'fs/promises';
import { tmpdir } from 'os';
import { randomBytes } from 'crypto';
import { FileNotFoundException } from './file-not-found.exception';
import { ProtectedPathModificationError } from '@aca/exceptions';
import { MODIFIABLE_PATHS, PROTECTED_PATHS } from '@aca/utils';

@Injectable()
export class FileAccessService {
  private readonly projectRoot = resolve(__dirname, '../../../..');

  async validatePath(path: string): Promise<boolean> {
    // Basic validation: prevent absolute paths and path traversal outside repo root
    if (!path || typeof path !== 'string') return false;
    if (path.startsWith('/') || path.includes('..')) return false;

    // Ensure path is under one of the allowed modifiable directories
  const ok = (MODIFIABLE_PATHS as string[]).some((p: string) => path === p || path.startsWith(p + '/'));
    if (!ok) return false;

    // Ensure it's not one of the explicitly protected files
    for (const protectedPath of PROTECTED_PATHS) {
      if (path === protectedPath || path.startsWith(protectedPath + '/')) return false;
    }

    return true;
  }

  async readFile(path: string): Promise<string> {
    // For reads we allow broader access within repo, but still block absolute and traversal attempts
    if (!path || typeof path !== 'string') throw new FileNotFoundException(path);
    if (path.startsWith('/') || path.includes('..')) throw new FileNotFoundException(path);

    const full = resolve(this.projectRoot, path);
    try {
      const content = await readFile(full, 'utf-8');
      return content;
    } catch (err) {
      throw new FileNotFoundException(path);
    }
  }

  async writeFile(path: string, content: string): Promise<void> {
    const ok = await this.validatePath(path);
    if (!ok) throw new FileNotFoundException(path);

    const full = resolve(this.projectRoot, path);
    const dir = dirname(full);

    // ensure directory exists
    await mkdir(dir, { recursive: true });

    // write to a temp file then atomically rename
    const tmpName = `${tmpdir()}/.tmp-${randomBytes(6).toString('hex')}`;
    await writeFile(tmpName, content, 'utf-8');
    try {
      await rename(tmpName, full);
    } catch (err: any) {
      // cross-device rename not permitted: fallback to copy+unlink
      if (err && err.code === 'EXDEV') {
        await copyFile(tmpName, full);
        await unlink(tmpName);
      } else {
        // rethrow other errors
        throw err;
      }
    }
    return;
  }
}
