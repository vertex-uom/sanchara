// Points a test run at its own Redis database (and, for e2e, its own Postgres
// schema) so tests never touch dev data. Used by the Vitest configs.

export function redisDbUrl(url: string | undefined, db: number): string | undefined {
  if (!url) return url;
  const parsed = new URL(url);
  parsed.pathname = `/${db}`;
  return parsed.toString();
}

export function postgresSchemaUrl(url: string | undefined, schema: string): string | undefined {
  if (!url) return url;
  const parsed = new URL(url);
  parsed.searchParams.set('schema', schema);
  return parsed.toString();
}
