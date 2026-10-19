const PLACEHOLDER_ORIGIN = "http://return-to.invalid";

// Where to send the traveller after signing in. Same-site relative paths only
// (no open redirects): one leading "/", no "//", no backslashes or control
// characters. Anything else returns null; callers fall back to "/".
export function safeReturnTo(value: unknown): string | null {
  if (typeof value !== "string" || value.length === 0 || value.length > 2048) return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  if (/[\\\u0000-\u001f\u007f]/.test(value)) return null;

  const url = new URL(value, PLACEHOLDER_ORIGIN);
  if (url.origin !== PLACEHOLDER_ORIGIN) return null;
  return `${url.pathname}${url.search}${url.hash}`;
}

// Link to an auth page that remembers where to come back to.
export function withReturnTo(path: string, returnTo: string | null): string {
  return returnTo ? `${path}?returnTo=${encodeURIComponent(returnTo)}` : path;
}
