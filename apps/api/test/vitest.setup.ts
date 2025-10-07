import { vi } from 'vitest';

// Provide a minimal jest-compatible global for tests that still use jest.fn()/spyOn
// Map the commonly used helpers to Vitest's vi
(globalThis as any).jest = {
  fn: vi.fn,
  spyOn: vi.spyOn,
  mock: vi.mock,
  clearAllMocks: vi.clearAllMocks,
  resetAllMocks: vi.resetAllMocks,
  restoreAllMocks: vi.restoreAllMocks,
};

export {};
