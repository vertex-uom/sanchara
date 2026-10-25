// DATABASE_URL comes from the environment (docker compose env_file).
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    // Compiled by the api's watch build (src/dev-seed.ts); run with `make seed`.
    seed: 'node dist/dev-seed.js',
  },
  datasource: {
    url: process.env['DATABASE_URL'],
  },
});
