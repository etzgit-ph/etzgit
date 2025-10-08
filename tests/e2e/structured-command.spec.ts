import { test, expect } from '@playwright/test';

test('TabUpgrades -> structured command -> Chat shows proposal and approve', async ({ page }) => {
  // Intercept /api/openai/command and return a mock proposal response
  await page.route('**/api/openai/command', async (route) => {
    const resp = {
      type: 'proposal',
      payload: {
        id: 'proposal-123',
        path: 'test.txt',
        newContent: 'updated content',
        rationale: 'Automated upgrade',
      },
    };
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(resp) });
  });

  // Intercept approve endpoint to simulate success
  await page.route('**/openai/approve-proposal', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, branch: 'agent/upgrade' }) });
  });

  await page.goto('/');

  // Click Upgrades tab
  await page.click('button:has-text("AI Suggested Upgrades")');

  // Click simulate button
  await page.click('button:has-text("Simulate: Upgrade Next.js")');

  // After submission, the UI should switch to Chat and show the notice
  await page.click('button:has-text("Chat")');

  // Expect the proposal review UI to appear
  await expect(page.locator('text=AI generated a proposal')).toBeVisible({ timeout: 3000 }).catch(() => {});

  // Approve button should be visible inside proposal review
  await expect(page.locator('button:has-text("Approve")')).toBeVisible({ timeout: 3000 });

  // Click Approve and assert success message appears
  await page.click('button:has-text("Approve")');
  await expect(page.locator('text=✅ Proposal approved')).toBeVisible({ timeout: 3000 });
});
