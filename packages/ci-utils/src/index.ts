export function maskSecret(value: string, visible = 4) {
  if (!value) return value;
  if (value.length <= visible) return '*'.repeat(value.length);
  const masked = '*'.repeat(value.length - visible) + value.slice(-visible);
  return masked;
}
