import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as http from 'http';
import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';
import { SecretTokenGuard } from '../common/guards/secret-token.guard';

describe('Agent run endpoint (E2E)', () => {
  let app: INestApplication;
  const secret = 'test-secret-123';

  beforeAll(async () => {
    // Mock ConfigService for guard
    const mockConfig = { get: (k: string) => (k === 'AGENT_RUN_SECRET' ? secret : undefined) };

    const mockAgentService = { runAutonomousUpgrade: jest.fn().mockResolvedValue({ success: true }) };

    const mod = await Test.createTestingModule({
      controllers: [AgentController],
      providers: [
        { provide: AgentService, useValue: mockAgentService },
        SecretTokenGuard,
        { provide: 'ConfigService', useValue: mockConfig },
        { provide: (require('@nestjs/config').ConfigService), useValue: mockConfig },
        { provide: (require('../common/services/security-audit.service').SecurityAuditService), useValue: { logEvent: jest.fn() } },
      ],
    }).compile();

  app = mod.createNestApplication();
  // listen on ephemeral port so we can perform real HTTP requests
  await app.listen(0);
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects requests without the agent secret', async () => {
    const server = (app as any).getHttpServer() as http.Server;
    const address = server.address() as any;
    const url = `http://127.0.0.1:${address.port}/api/v1/run-agent`;

    const res = await new Promise<http.IncomingMessage>((resolve, reject) => {
      const r = http.request(url, { method: 'POST' }, (r) => resolve(r));
      r.on('error', reject);
      r.end();
    });
    expect(res.statusCode).toBe(401);
  });

  it('allows requests with the correct agent secret', async () => {
    const server = (app as any).getHttpServer() as http.Server;
    const address = server.address() as any;
    const url = `http://127.0.0.1:${address.port}/api/v1/run-agent`;

    const res = await new Promise<http.IncomingMessage>((resolve, reject) => {
      const r = http.request(url, { method: 'POST', headers: { 'x-agent-secret-key': secret } }, (r) => resolve(r));
      r.on('error', reject);
      r.end();
    });
    expect(res.statusCode).toBe(200);
  });
});
