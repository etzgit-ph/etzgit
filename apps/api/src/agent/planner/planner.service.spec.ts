import { PlannerService } from './planner.service';

describe('PlannerService', () => {
  it('returns a safe PatchRequestDTO array', async () => {
    const svc = new PlannerService();
    const res = await svc.determineNextAction();
    expect(Array.isArray(res)).toBe(true);
    expect(res[0].filePath).toBe('README.md');
  });
});
