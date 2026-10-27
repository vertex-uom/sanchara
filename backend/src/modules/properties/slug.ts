// URL slug from a display name: "Ella Rock Villa" → "ella-rock-villa".
// Accents are dropped; names with no Latin letters or digits fall back to
// "property". Kept short enough to leave room for a "-2" style suffix.
export const SLUG_MAX = 60;

export function slugify(name: string): string {
  const slug = name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, SLUG_MAX)
    .replace(/^-+|-+$/g, '');
  return slug || 'property';
}

// The first of base, base-2, base-3, … that isn't taken.
export function nextFreeSlug(base: string, taken: ReadonlySet<string>): string {
  if (!taken.has(base)) return base;
  for (let n = 2; ; n++) {
    const candidate = `${base}-${n}`;
    if (!taken.has(candidate)) return candidate;
  }
}
