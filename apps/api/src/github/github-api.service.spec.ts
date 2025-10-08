import { GithubApiService } from './github-api.service';

describe('GithubApiService', () => {
  it('calls octokit.pulls.create when client is set', async () => {
    const mockOctokit: any = {
      pulls: {
        create: jest.fn().mockResolvedValue({ data: { html_url: 'http://pr' } }),
      },
    };

    const svc = new GithubApiService();
    svc.setClient(mockOctokit as any);

    const res = await svc.createPullRequest('owner', 'repo', 'ai-branch', 'main', 'title', 'body');
    expect(mockOctokit.pulls.create).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      head: 'ai-branch',
      base: 'main',
      title: 'title',
      body: 'body',
    });
    expect(res.url).toBe('http://pr');
  });
});
