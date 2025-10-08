import { Module } from '@nestjs/common';
import { GitCommandService } from './git-command.service';

@Module({
  providers: [GitCommandService],
  exports: [GitCommandService],
})
export class GitModule {}
