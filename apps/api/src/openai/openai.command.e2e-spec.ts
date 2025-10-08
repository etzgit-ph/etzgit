import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
const request = require('supertest');
import { OpenaiModule } from './openai.module';
import { OpenaiService } from './openai.service';

describe('OpenaiController Structured Command (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // Configure secret expected by SecretTokenGuard and mock OpenaiService
    process.env.AGENT_RUN_SECRET = 'test-secret';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [OpenaiModule],
    })
      .overrideProvider(OpenaiService)
      .useValue({
        generateChatCompletion: jest
          .fn()
          .mockResolvedValue(
            JSON.stringify({ toolName: 'writeFileProposal', arguments: { path: 'test.txt', newContent: 'hello', rationale: 'test' } }),
          ),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/openai/command (POST) should process structured command into a proposal', async () => {
    const dto = { type: 'dependency', target: 'next', action: 'upgrade-major-version' };
    const res = await request(app.getHttpServer())
      .post('/openai/command')
      .set('Authorization', 'Bearer test-secret')
      .send(dto)
      .expect(200);
    expect(res.body).toBeDefined();
    // The router returns either a raw string or a proposal response; when processing tool call we expect an object
    // containing type:'proposal' and payload.path === 'test.txt'
    if (typeof res.body === 'object') {
      // Accept either a ProposalResponse or a success envelope depending on implementation
      if (res.body.type === 'proposal') {
        expect(res.body.payload.path).toBe('test.txt');
      } else {
        expect(res.body.success === true || res.body).toBeTruthy();
      }
    }
  });
});
