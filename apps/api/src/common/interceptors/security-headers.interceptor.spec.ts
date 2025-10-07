import { Test } from '@nestjs/testing';
import { INestApplication, Controller, Get } from '@nestjs/common';
import * as http from 'http';
import { SecurityHeadersInterceptor } from './security-headers.interceptor';

@Controller()
class TestController {
  @Get('/__test')
  get() {
    return { ok: true };
  }
}

describe('SecurityHeadersInterceptor', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // enable strict headers for this test
    process.env.SECURITY_HEADERS_STRICT = 'true';
    const mockConfig = { get: (k: string) => process.env[k] };
    const mod = await Test.createTestingModule({
      controllers: [TestController],
      providers: [
        SecurityHeadersInterceptor,
        { provide: 'ConfigService', useValue: mockConfig },
        { provide: (require('@nestjs/config').ConfigService), useValue: mockConfig },
      ],
    }).compile();
  app = mod.createNestApplication();
  const interceptor = app.get(SecurityHeadersInterceptor);
  app.useGlobalInterceptors(interceptor);
  // listen on ephemeral port so we can perform real HTTP requests
  await app.listen(0);
  });

  afterAll(async () => {
    await app.close();
  });

  it('sets security headers on responses', async () => {
    const server = (app as any).getHttpServer() as http.Server;
    const address = server.address();
    let url: string;
    if (address && typeof address === 'object') {
      url = `http://127.0.0.1:${address.port}/__test`;
    } else {
      url = `http://127.0.0.1:3000/__test`;
    }

    const res = await new Promise<http.IncomingMessage>((resolve, reject) => {
      http.get(url, (r) => resolve(r)).on('error', reject);
    });

    expect(res.statusCode).toBe(200);
    expect(res.headers['strict-transport-security']).toBeDefined();
    expect(res.headers['x-frame-options']).toBeDefined();
    expect(res.headers['content-security-policy']).toBeDefined();
  });
});
