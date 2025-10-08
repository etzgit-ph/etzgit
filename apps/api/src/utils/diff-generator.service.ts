import { Injectable } from '@nestjs/common';
import { createPatch } from 'diff';

@Injectable()
export class DiffGeneratorService {
  generateDiff(oldContent: string, newContent: string, fileName = 'file'): string {
    // createPatch(fileName, oldContent, newContent) returns unified diff
    return createPatch(fileName, oldContent, newContent);
  }
}
