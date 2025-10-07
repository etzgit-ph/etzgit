import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './',
  timeout: 30_000,
  expect: { timeout: 5000 },
  fullyParallel: false,
  reporter: 'list',
  use: {
    actionTimeout: 0,
    baseURL: process.env.E2E_BASE_URL || 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
