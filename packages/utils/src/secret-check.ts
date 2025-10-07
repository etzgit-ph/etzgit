export type SecretFinding = { pattern: string; snippet: string; index: number };

// Heuristic secret detectors. Keep conservative to avoid false positives.
const patterns: { name: string; re: RegExp }[] = [
  // AWS Access Key ID
  { name: 'aws-access-key-id', re: /\bAKIA[0-9A-Z]{16}\b/g },
  // Google API key
  { name: 'google-api-key', re: /\bAIza[0-9A-Za-z-_]{35}\b/g },
  // GitHub token prefix
  { name: 'github-token', re: /\bghp_[0-9A-Za-z_]{36,}\b/g },
  // Bearer token header
  { name: 'bearer-token', re: /Bearer\s+[A-Za-z0-9\-._~+/]+=*/g },
  // PEM private key blocks
  { name: 'private-key-pem', re: /-----BEGIN (?:RSA )?PRIVATE KEY-----[\s\S]{20,}?-----END (?:RSA )?PRIVATE KEY-----/g },
  // Long hex blobs (e.g., private key fragments) - require length >= 64
  { name: 'long-hex', re: /\b[0-9a-fA-F]{64,}\b/g },
  // JWT-like token (three base64url parts)
  { name: 'jwt-like', re: /[A-Za-z0-9-_]{8,}\.[A-Za-z0-9-_]{8,}\.[A-Za-z0-9-_]{8,}/g },
];

export function hasSecrets(content: string): { found: boolean; findings: SecretFinding[] } {
  if (!content) return { found: false, findings: [] };
  const findings: SecretFinding[] = [];

  for (const p of patterns) {
    let m: RegExpExecArray | null;
    // Reset lastIndex for global regex
    p.re.lastIndex = 0;
    while ((m = p.re.exec(content)) !== null) {
      const snippet = m[0].slice(0, 200);
      findings.push({ pattern: p.name, snippet, index: m.index });
      // Avoid runaway - break if too many matches
      if (findings.length > 20) break;
    }
    if (findings.length > 20) break;
  }

  return { found: findings.length > 0, findings };
}
