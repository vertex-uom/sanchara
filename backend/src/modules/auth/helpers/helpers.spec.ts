import { checkGoogleClaims, decodeJwtPayload } from './google-claims.js';
import { E164_PATTERN, normaliseEmail, normaliseMobile } from './normalise.js';
import { safeReturnTo } from './return-to.js';

describe('safeReturnTo', () => {
  const options = { isAllowedHost: (host: string) => host === 'palm.sanchara.localhost', allowHttp: false };

  it.each([
    ['/account', '/account'],
    ['/account/bookings?tab=past#top', '/account/bookings?tab=past#top'],
    ['/a/../b', '/b'],
  ])('keeps same-site path %s', (input, expected) => {
    expect(safeReturnTo(input, options)).toBe(expected);
  });

  it.each([
    '//evil.com',
    '/\\evil.com',
    '\\\\evil.com',
    'https://evil.com/account',
    'javascript:alert(1)',
    'https://user:pw@palm.sanchara.localhost/',
    'http://palm.sanchara.localhost/',
    '/a\nb',
    '',
    `/${'a'.repeat(2048)}`,
  ])('rejects %j', (input) => {
    expect(safeReturnTo(input, options)).toBeNull();
  });

  it('allows https to registered hosts, and http only when allowed', () => {
    expect(safeReturnTo('https://palm.sanchara.localhost/book', options)).toBe('https://palm.sanchara.localhost/book');
    expect(safeReturnTo('http://palm.sanchara.localhost/book', { ...options, allowHttp: true })).toBe(
      'http://palm.sanchara.localhost/book',
    );
  });
});

describe('normalise', () => {
  it('trims and lowercases emails', () => {
    expect(normaliseEmail('  Nisal@Example.COM ')).toBe('nisal@example.com');
  });

  it('cleans mobile numbers to E.164', () => {
    expect(normaliseMobile('+94 (77) 123-4567')).toBe('+94771234567');
    expect(E164_PATTERN.test('+94771234567')).toBe(true);
    expect(E164_PATTERN.test('0771234567')).toBe(false);
  });
});

describe('Google claims', () => {
  const check = { clientId: 'client-1', nonce: 'n1', nowSeconds: 1000 };
  const good = {
    iss: 'https://accounts.google.com',
    aud: 'client-1',
    exp: 2000,
    nonce: 'n1',
    sub: '1234',
    email: 'Guest@Gmail.com',
    email_verified: true,
    name: ' Guest Name ',
  };

  it('accepts valid claims', () => {
    expect(checkGoogleClaims(good, check)).toEqual({ subject: '1234', email: 'Guest@Gmail.com', name: 'Guest Name' });
  });

  it.each([
    ['unverified email', { email_verified: false }],
    ['wrong issuer', { iss: 'https://evil.com' }],
    ['wrong audience', { aud: 'other' }],
    ['expired', { exp: 999 }],
    ['wrong nonce', { nonce: 'n2' }],
    ['missing subject', { sub: '' }],
  ])('rejects %s', (_label, change) => {
    expect(checkGoogleClaims({ ...good, ...change }, check)).toBeNull();
  });

  it('decodes a JWT payload and rejects garbage', () => {
    const payload = Buffer.from(JSON.stringify({ sub: 'x' })).toString('base64url');
    expect(decodeJwtPayload(`h.${payload}.s`)).toEqual({ sub: 'x' });
    expect(decodeJwtPayload('not-a-jwt')).toBeNull();
    expect(decodeJwtPayload('a.!!!.c')).toBeNull();
  });
});
