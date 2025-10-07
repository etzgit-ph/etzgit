import { SystemService } from './system.service';

describe('SystemService', () => {
  it('returns a status object with uptime', () => {
    const svc = new SystemService();
    const s = svc.getStatus();
    expect(s).toHaveProperty('uptime');
    expect(typeof s.uptime).toBe('number');
  });
});
