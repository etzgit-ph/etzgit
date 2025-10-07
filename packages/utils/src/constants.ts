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
  // A conservative CSP suitable for APIs/frontends that only serve their own content.
  // Allows self for scripts/styles, blocks objects, permits data: for images.
  {
    key: 'Content-Security-Policy',
    value:
      "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'",
  },
];
