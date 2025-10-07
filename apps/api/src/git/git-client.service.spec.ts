import { GitClientService } from './git-client.service';

describe('GitClientService', () => {
  it('should mock git status', () => {
    const service = new GitClientService();
    // Use Jest spy for the Jest test runner
    jest.spyOn(service, 'runGitStatus').mockReturnValue('M file.txt');
    expect(service.runGitStatus()).toBe('M file.txt');
  });
});
