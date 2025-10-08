import { Injectable, Logger } from '@nestjs/common';

type OctokitType = any;

@Injectable()
export class GithubApiService {
  private readonly logger = new Logger(GithubApiService.name);
  private octokit: OctokitType | null = null;

  constructor() {
    const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || process.env.GITHUB_PAT;
    if (token) {
      try {
        // require at runtime to avoid ESM parsing errors in Jest
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { Octokit } = require('octokit');
        this.octokit = new Octokit({ auth: token });
      } catch (err) {
        this.octokit = null;
      }
    } else {
      this.octokit = null;
    }
  }

  // Allow injecting an Octokit instance in tests
  setClient(client: OctokitType) {
    this.octokit = client;
  }

  async createPullRequest(owner: string, repo: string, head: string, base: string, title: string, body: string) {
    if (!this.octokit) {
      this.logger.warn('No GitHub client configured; skipping PR creation');
      return { url: null };
    }

    const res = await this.octokit.pulls.create({
      owner,
      repo,
      head,
      base,
      title,
      body,
    });

    return { url: res.data.html_url };
  }
}
