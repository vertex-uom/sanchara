import { defineConfig } from 'vitest/config';
import { redisDbUrl } from './test/support/test-env.js';

// Unit tests that need Redis use database 2 of the compose Redis.
process.env['REDIS_URL'] = redisDbUrl(process.env['REDIS_URL'], 2);

export default defineConfig({
  // Resolves the path aliases declared in tsconfig.json, including the ones
  // added by `nest g library`. Requires Vite 8, which ships this option.
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    // Decorators (Nest DI, class-validator) need the Reflect metadata API.
    setupFiles: ['reflect-metadata'],
    include: ['**/*.spec.ts'],
    // Specs sharing Redis database 2 must not flush each other's keys.
    fileParallelism: false,
  },
});
