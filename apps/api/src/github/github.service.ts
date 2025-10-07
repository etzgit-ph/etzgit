import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GitHubService {

  constructor(private readonly configService: ConfigService) {}

  async createPullRequest(branchName: string, title: string, body: string) {
    // Dynamically import Octokit to avoid static ESM import issues in test runners
    const { Octokit } = await import('octokit');
    const octokit = new Octokit({ auth: this.configService.get<string>('GITHUB_TOKEN') });

    // Always target main to enforce human-in-the-loop
    const owner = this.configService.get<string>('GITHUB_OWNER') || 'owner';
    const repo = this.configService.get<string>('GITHUB_REPO') || 'repo';
    const response = await octokit.rest.pulls.create({
      owner,
      repo,
      title,
      head: branchName,
      base: 'main',
      body,
    });
    return response;
  }

  // Add methods for GitHub API interaction here
}
