import { NotFoundException } from '@nestjs/common';

export class FileNotFoundException extends NotFoundException {
  constructor(path: string) {
    super(`File not found: ${path}`);
  }
}
