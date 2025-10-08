import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
const request = require('supertest');
import { OpenaiModule } from './openai.module';
import { OpenaiService } from './openai.service';
import { OpenaiController } from './openai.controller';

describe('OpenaiController (e2e)', () => {
  let app: INestApplication;
  let openaiService: OpenaiService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [OpenaiModule],
    })
      .overrideProvider(OpenaiService)
      .useValue({
        generateChatCompletion: jest.fn().mockResolvedValue('mocked response'),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    openaiService = moduleFixture.get<OpenaiService>(OpenaiService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('/openai/chat (POST) should return mocked response', async () => {
    return request(app.getHttpServer())
      .post('/openai/chat')
      .send({ prompt: 'Hello, world!' })
      .expect(201)
      .expect('mocked response');
  });
});
