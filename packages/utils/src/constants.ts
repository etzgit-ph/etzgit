export const MODIFIABLE_PATHS = [
  'apps/api/src',
];

export const PROTECTED_PATHS = [
  '.env',
  'SECURITY.md',
  '.github/workflows/',
];

export const RATE_LIMIT_MAX_REQUESTS = 10;
export const RATE_LIMIT_TIME_WINDOW_MS = 60000;
export const MANDATORY_SECURITY_HEADERS = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Content-Security-Policy', value: "default-src 'self'" },
];
