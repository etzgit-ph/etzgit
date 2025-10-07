import { defineConfig } from 'vitest/config';
import * as path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@aca/utils': path.resolve(__dirname, 'packages/utils/src'),
      '@aca/exceptions': path.resolve(__dirname, 'packages/exceptions/src'),
      '@aca/shared-types': path.resolve(__dirname, 'packages/shared-types/src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    setupFiles: [path.resolve(__dirname, 'apps/api/test/vitest.setup.ts')],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
      },
    },
  },
});
