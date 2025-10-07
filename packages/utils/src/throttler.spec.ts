import { Throttler } from './throttler';

describe('Throttler', () => {
  it('allows up to max requests and queues the rest', async () => {
    const t = new Throttler(2, 200);
    const results: number[] = [];

    // Acquire 3 tokens quickly; the 3rd should wait until window slides
    const p1 = t.acquire().then(() => results.push(1));
    const p2 = t.acquire().then(() => results.push(2));
    const p3 = t.acquire().then(() => results.push(3));

    await Promise.all([p1, p2]);
    // at this point, only first two should have resolved
    expect(results).toEqual([1, 2]);

    // wait for window to expire
    await new Promise((r) => setTimeout(r, 220));
    await p3;
    expect(results).toEqual([1, 2, 3]);
  }, 10000);
});
