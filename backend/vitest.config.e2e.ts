import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    // Decorators (Nest DI, class-validator) need the Reflect metadata API.
    setupFiles: ['reflect-metadata'],
    include: ['**/*.e2e-spec.ts'],
  },
});
