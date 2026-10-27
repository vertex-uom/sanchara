import { nextFreeSlug, slugify, SLUG_MAX } from './slug.js';

describe('slugify', () => {
  it('lowercases and joins words with hyphens', () => {
    expect(slugify('  Ella Rock   Villa! ')).toBe('ella-rock-villa');
  });

  it('drops accents and keeps digits', () => {
    expect(slugify('Café Mirissa 2')).toBe('cafe-mirissa-2');
  });

  it('falls back when nothing Latin is left', () => {
    expect(slugify('ශ්‍රී ලංකා')).toBe('property');
    expect(slugify('---')).toBe('property');
  });

  it('caps the length without a trailing hyphen', () => {
    const slug = slugify(`${'a'.repeat(SLUG_MAX - 1)} b`);
    expect(slug.length).toBeLessThanOrEqual(SLUG_MAX);
    expect(slug.endsWith('-')).toBe(false);
  });
});

describe('nextFreeSlug', () => {
  it('uses the base when free, otherwise the first free suffix', () => {
    expect(nextFreeSlug('palm', new Set())).toBe('palm');
    expect(nextFreeSlug('palm', new Set(['palm', 'palm-2']))).toBe('palm-3');
  });
});
