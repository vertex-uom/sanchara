import { createHash, randomBytes } from 'node:crypto';

// 32 random bytes as base64url = 43 characters.
export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

export const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export function isWellFormedToken(value: unknown): value is string {
  return typeof value === 'string' && TOKEN_PATTERN.test(value);
}

// Tokens are stored in Redis by hash only, so a leaked dump can't be replayed.
export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

// PKCE S256 challenge for a code verifier.
export function pkceChallenge(verifier: string): string {
  return createHash('sha256').update(verifier).digest('base64url');
}
