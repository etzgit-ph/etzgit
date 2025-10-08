import { Module } from '@nestjs/common';
import { GithubApiService } from './github-api.service';

@Module({
  providers: [GithubApiService],
  exports: [GithubApiService],
})
export class GithubModule {}
import { Module } from '@nestjs/common';
import { GitHubService } from './github.service';

@Module({
  providers: [GitHubService],
  exports: [GitHubService],
})
export class GitHubModule {}
