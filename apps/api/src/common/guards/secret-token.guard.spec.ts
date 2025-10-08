import { Test } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { SecretTokenGuard } from './secret-token.guard';
import { SecurityAuditService } from '../services/security-audit.service';

describe('SecretTokenGuard', () => {
  it('allows when header matches config', async () => {
    const mockConfig = { get: (k: string) => 's3cr3t' } as any;
    const mockAudit = { logEvent: jest.fn() };
    const mod = await Test.createTestingModule({
      providers: [
        SecretTokenGuard,
        { provide: 'ConfigService', useValue: mockConfig },
        { provide: require('@nestjs/config').ConfigService, useValue: mockConfig },
        { provide: SecurityAuditService, useValue: mockAudit },
      ],
    }).compile();
    const guard = mod.get(SecretTokenGuard);
    const ctx: any = {
      switchToHttp: () => ({ getRequest: () => ({ headers: { 'x-agent-secret-key': 's3cr3t' } }) }),
    };
    expect(guard.canActivate(ctx as ExecutionContext)).toBe(true);
  });

  it('rejects when header missing or wrong', async () => {
    const mockConfig = { get: (k: string) => 's3cr3t' } as any;
    const mockAudit = { logEvent: jest.fn() };
    const mod = await Test.createTestingModule({
      providers: [
        SecretTokenGuard,
        { provide: 'ConfigService', useValue: mockConfig },
        { provide: require('@nestjs/config').ConfigService, useValue: mockConfig },
        { provide: SecurityAuditService, useValue: mockAudit },
      ],
    }).compile();
    const guard = mod.get(SecretTokenGuard);
    const badCtx: any = { switchToHttp: () => ({ getRequest: () => ({ headers: {} }) }) };
    expect(() => guard.canActivate(badCtx as ExecutionContext)).toThrow(UnauthorizedException);
  });

  it('accepts bearer token in Authorization header', async () => {
    const mockConfig = { get: (k: string) => 'bearer-token-1' } as any;
    const mockAudit = { logEvent: jest.fn() };
    const mod = await Test.createTestingModule({
      providers: [
        SecretTokenGuard,
        { provide: 'ConfigService', useValue: mockConfig },
        { provide: require('@nestjs/config').ConfigService, useValue: mockConfig },
        { provide: SecurityAuditService, useValue: mockAudit },
      ],
    }).compile();
    const guard = mod.get(SecretTokenGuard);
    const ctx: any = {
      switchToHttp: () => ({
        getRequest: () => ({ headers: { authorization: 'Bearer bearer-token-1' } }),
      }),
    };
    expect(guard.canActivate(ctx as ExecutionContext)).toBe(true);
  });
});
