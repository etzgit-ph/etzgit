import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttler, defaultThrottler } from '@aca/utils';

@Injectable()
export class GitHubService {

  constructor(private readonly configService: ConfigService, private readonly throttler: Throttler = defaultThrottler) {}

  async createPullRequest(branchName: string, title: string, body: string) {
    // Dynamically import Octokit to avoid static ESM import issues in test runners
    const { Octokit } = await import('octokit');
    const octokit = new Octokit({ auth: this.configService.get<string>('GITHUB_TOKEN') });

    // Always target main to enforce human-in-the-loop
    const owner = this.configService.get<string>('GITHUB_OWNER') || 'owner';
    const repo = this.configService.get<string>('GITHUB_REPO') || 'repo';
    // throttle GitHub API calls to avoid hitting rate limits
    await this.throttler.acquire();

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
