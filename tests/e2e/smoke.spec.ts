import { test, expect } from '@playwright/test';

test('status endpoint returns 200', async ({ request }) => {
  const res = await request.get('/api/v1/status');
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body).toHaveProperty('uptime');
});
