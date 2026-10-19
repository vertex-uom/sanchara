import { RequestMethod } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';

// Shared by main.ts and the e2e tests so both run the same app.
export function configureApp(app: NestExpressApplication) {
  // REST lives under /v1; /health stays at the root for the Docker healthcheck.
  app.setGlobalPrefix('v1', { exclude: [{ path: 'health', method: RequestMethod.GET }] });

  // Only trust X-Forwarded-For from the proxies named in TRUST_PROXY (e.g. the Next server).
  const trustProxy = process.env['TRUST_PROXY']?.trim();
  app.set('trust proxy', trustProxy ? trustProxy.split(',').map((value) => value.trim()) : false);
  app.disable('x-powered-by');

  // No CORS: browsers never call the API directly (BFF). Shut down cleanly on SIGTERM.
  app.enableShutdownHooks();
  return app;
}
