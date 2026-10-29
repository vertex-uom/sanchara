// Page searchParams as Next passes them.
export type SearchParams = Record<string, string | string[] | undefined>;

// A repeated param (?a=1&a=2) is treated as invalid, like a missing one.
export function single(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined;
}
