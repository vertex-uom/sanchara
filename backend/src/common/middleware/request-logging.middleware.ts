import { Injectable, Logger, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

// One line per request, written once the response is sent so the status is final
// (errors, 404s). Only method, path (no query string), status and timing: bodies,
// headers and query strings can hold passwords or tokens.
@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(request: Request, response: Response, next: NextFunction) {
    const started = performance.now();
    response.once('finish', () => {
      // The Docker healthcheck polls every 10s; only log it when it fails.
      if (request.path === '/health' && response.statusCode < 400) return;
      const ms = Math.round(performance.now() - started);
      this.logger.log(`${request.method} ${request.path} ${response.statusCode} ${ms}ms [${request.id}]`);
    });
    next();
  }
}
