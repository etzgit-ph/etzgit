import { Module } from '@nestjs/common';
import { GitClientService } from './git-client.service';

@Module({
  providers: [GitClientService],
  exports: [GitClientService],
})
export class GitClientModule {}
