import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OpenaiService } from './openai.service';
import { OpenaiController } from './openai.controller';
import { OpenaiCommandRouterService } from './openai-command-router.service';
import { FileAccessService } from '../filesystem/file-access.service';
import { GitModule } from '../git/git.module';
import { GithubModule } from '../github/github.module';
import { SecretsModule } from '../secrets/secrets.module';
import { SecurityAuditService } from '../common/services/security-audit.service';

@Module({
  imports: [GitModule, GithubModule, ConfigModule, SecretsModule],
  providers: [OpenaiService, OpenaiCommandRouterService, FileAccessService, SecurityAuditService],
  controllers: [OpenaiController],
  exports: [OpenaiService],
})
export class OpenaiModule {}
