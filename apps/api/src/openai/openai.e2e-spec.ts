import { Test, TestingModule } from '@nestjs/testing';
import { OpenaiController } from './openai.controller';
import { OpenaiService } from './openai.service';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';

describe('OpenaiController (e2e)', () => {
  let app: INestApplication;
  let service: OpenaiService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [OpenaiController],
      providers: [
        {
          provide: OpenaiService,
          useValue: {
            generateChatCompletion: jest.fn().mockResolvedValue('mocked-response'),
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    service = moduleFixture.get<OpenaiService>(OpenaiService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /openai/chat returns chat completion', async () => {
    return request(app.getHttpServer())
      .post('/openai/chat')
      .send({ prompt: 'Hello', model: 'gpt-4' })
      .expect(201)
      .expect({ completion: 'mocked-response' });
  });
});
