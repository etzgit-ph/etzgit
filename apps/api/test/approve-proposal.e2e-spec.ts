import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
const request = require('supertest');
import { OpenaiModule } from '../src/openai/openai.module';
import { OpenaiService } from '../src/openai/openai.service';

describe('Approve Proposal E2E', () => {
  let app: INestApplication;

  const mockFileAccess = {
    writeFile: jest.fn().mockResolvedValue(undefined),
  };

  const mockGit = {
    checkoutBranch: jest.fn().mockResolvedValue(undefined),
    commitFile: jest.fn().mockResolvedValue(undefined),
    pushBranch: jest.fn().mockResolvedValue(undefined),
  };

  const mockGithub = {
    createPullRequest: jest.fn().mockResolvedValue({ url: 'http://pr' }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [OpenaiModule],
    })
      .overrideProvider(OpenaiService)
      .useValue({ generateChatCompletion: jest.fn().mockResolvedValue('ok') })
      .overrideProvider('FileAccessService')
      .useValue(mockFileAccess)
      .overrideProvider('GitCommandService')
      .useValue(mockGit)
      .overrideProvider('GithubApiService')
      .useValue(mockGithub)
      .overrideProvider('SecretTokenGuard')
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/openai/approve-proposal should execute write->commit->push->createPR', async () => {
    const payload = { id: 'abc123', path: 'apps/api/src/test-file.ts', newContent: 'console.log(1);' };

    await request(app.getHttpServer())
      .post('/openai/approve-proposal')
      .set('AGENT_RUN_SECRET', 'test-secret')
      .send(payload)
      .expect(200)
      .expect((res: any) => {
        expect(res.body.success).toBe(true);
        expect(res.body.branch).toBeDefined();
      });

    expect(mockGit.checkoutBranch).toHaveBeenCalled();
    expect(mockFileAccess.writeFile).toHaveBeenCalledWith('apps/api/src/test-file.ts', 'console.log(1);');
    expect(mockGit.commitFile).toHaveBeenCalled();
    expect(mockGit.pushBranch).toHaveBeenCalled();
    expect(mockGithub.createPullRequest).toHaveBeenCalled();
  });
});
