import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      thresholds: {
        lines: 5,
        functions: 5,
        branches: 5,
      },
    },
  },
});
