// Page searchParams as Next passes them.
export type SearchParams = Record<string, string | string[] | undefined>;

// A repeated param (?a=1&a=2) is treated as invalid, like a missing one.
export function single(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined;
}

// The value when it is one of `allowed`, otherwise the fallback.
export function oneOf<T extends string>(value: string | undefined, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

// ?page as a positive whole number; 1 when missing or invalid.
export function parsePage(params: SearchParams) {
  const page = Number.parseInt(single(params.page) ?? "1", 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}
