import { execFileSync } from 'node:child_process';

// Brings the e2e schema up to date before any test runs (creates it if missing).
export default function setup() {
  if (!process.env['DATABASE_URL']?.includes('schema=e2e')) {
    throw new Error('e2e must run against the "e2e" schema; check vitest.config.e2e.ts');
  }
  execFileSync('npx', ['prisma', 'migrate', 'deploy'], { stdio: 'inherit', env: process.env });
}
