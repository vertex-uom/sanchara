import { defineConfig } from 'vitest/config';
import { postgresSchemaUrl, redisDbUrl } from './test/support/test-env.js';

// e2e runs against the compose services but in their own space: Postgres
// schema "e2e" and Redis database 1. Set here so globalSetup and tests share it.
process.env['DATABASE_URL'] = postgresSchemaUrl(process.env['DATABASE_URL'], 'e2e');
process.env['REDIS_URL'] = redisDbUrl(process.env['REDIS_URL'], 1);

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    // Decorators (Nest DI, class-validator) need the Reflect metadata API.
    setupFiles: ['reflect-metadata'],
    globalSetup: ['./test/support/e2e-global-setup.ts'],
    include: ['**/*.e2e-spec.ts'],
    // One database for all e2e files; run them one at a time.
    fileParallelism: false,
  },
});
