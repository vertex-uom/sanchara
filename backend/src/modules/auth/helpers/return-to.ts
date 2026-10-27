type ReturnToOptions = {
  // Absolute URLs are only allowed for hosts this returns true for.
  isAllowedHost: (host: string) => boolean;
  // Plain http is accepted outside production (local *.localhost hosts).
  allowHttp: boolean;
};

const PLACEHOLDER_ORIGIN = 'http://return-to.invalid';

// Returns a safe redirect target or null (caller falls back to its default).
// Same-site paths: must start with one "/", no "//", no backslashes or control
// characters. Absolute: http(s) only, no credentials, host must be allowed.
export function safeReturnTo(value: string | null | undefined, options: ReturnToOptions): string | null {
  if (!value || value.length > 2048) return null;
  // eslint-disable-next-line no-control-regex
  if (/[\\\u0000-\u001f\u007f]/.test(value)) return null;

  if (value.startsWith('/')) {
    if (value.startsWith('//')) return null;
    const url = new URL(value, PLACEHOLDER_ORIGIN);
    if (url.origin !== PLACEHOLDER_ORIGIN) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  const protocolOk = url.protocol === 'https:' || (options.allowHttp && url.protocol === 'http:');
  if (!protocolOk || url.username || url.password) return null;
  return options.isAllowedHost(url.hostname) ? url.href : null;
}
