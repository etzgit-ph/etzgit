import { GitHubService } from './github.service';
import { ConfigService } from '@nestjs/config';

jest.mock('octokit', () => ({
  Octokit: jest
    .fn()
    .mockImplementation(() => ({
      rest: { pulls: { create: jest.fn().mockResolvedValue({ data: { html_url: 'http://pr' } }) } },
    })),
}));

describe('GitHubService', () => {
  it('creates a pull request with base main', async () => {
    const cfg: any = {
      get: jest.fn().mockImplementation((k: string) => (k === 'GITHUB_TOKEN' ? 't' : 'owner')),
    };
    const svc = new GitHubService(cfg as ConfigService);
    // @ts-ignore
    const resp = await svc.createPullRequest('branch', 'title', 'body');
    expect(resp.data.html_url).toBe('http://pr');
  });
});
