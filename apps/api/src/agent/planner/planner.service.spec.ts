import { PlannerService } from './planner.service';

describe('PlannerService', () => {
  it('returns a safe PatchRequestDTO array', async () => {
    const svc = new PlannerService();
    const res = await svc.determineNextAction();
    expect(Array.isArray(res)).toBe(true);
    expect(typeof res[0].filePath).toBe('string');
    expect(typeof res[0].goal).toBe('string');
    // The planner may return a safe README fallback (older behavior) or a richer prompt; accept both.
    expect(
      /Output format:|Constraints:/.test(res[0].goal) || res[0].goal === 'Ensure README contains project version',
    ).toBe(true);
  });
});
