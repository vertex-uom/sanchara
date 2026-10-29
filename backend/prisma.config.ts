// DATABASE_URL comes from the environment (docker compose env_file).
import { defineConfig } from 'prisma/config';
import './src/load-env.js';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env['DATABASE_URL'],
  },
});
