export * from './constants';
export * from './secret-check';
export * from './throttler';

export function isDevelopment() {
  return typeof process !== 'undefined' && process.env.NODE_ENV === 'development';
}
