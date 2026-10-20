export type GoogleProfile = { subject: string; email: string; name: string | null };

type ClaimCheck = { clientId: string; nonce: string; nowSeconds: number };

const ISSUERS = new Set(['https://accounts.google.com', 'accounts.google.com']);

// Payload of a JWT, without verifying the signature. Safe here only because the
// id_token comes straight from Google's token endpoint over TLS (OIDC Core 3.1.3.7).
export function decodeJwtPayload(jwt: string): Record<string, unknown> | null {
  const parts = jwt.split('.');
  if (parts.length !== 3) return null;
  try {
    const payload: unknown = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    return payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

// Returns the profile, or null if any claim is wrong. Only verified emails pass.
export function checkGoogleClaims(claims: Record<string, unknown>, check: ClaimCheck): GoogleProfile | null {
  const { iss, aud, exp, nonce, sub, email, email_verified: emailVerified, name } = claims;
  const audienceOk = aud === check.clientId || (Array.isArray(aud) && aud.includes(check.clientId));

  if (typeof iss !== 'string' || !ISSUERS.has(iss)) return null;
  if (!audienceOk) return null;
  if (typeof exp !== 'number' || exp <= check.nowSeconds) return null;
  if (nonce !== check.nonce) return null;
  if (typeof sub !== 'string' || sub.length === 0) return null;
  if (typeof email !== 'string' || emailVerified !== true) return null;

  return { subject: sub, email, name: typeof name === 'string' && name.trim() ? name.trim() : null };
}
