import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
describe('App', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      // Add your providers/controllers here
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });

  afterAll(async () => {
    await app.close();
  });
});
