import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Local runs read the repo-root .env (src/ and dist/ both sit two levels below it);
// docker sets the variables itself. loadEnvFile never overrides variables already set.
const ROOT_ENV = fileURLToPath(new URL('../../.env', import.meta.url));
if (existsSync(ROOT_ENV)) process.loadEnvFile(ROOT_ENV);
