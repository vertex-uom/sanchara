import { type CallHandler, type ExecutionContext, Injectable, Logger, type NestInterceptor } from '@nestjs/common';
import type { Request, Response } from 'express';
import { finalize } from 'rxjs';

// One line per request. Only method, path (no query string), status and timing:
// bodies, headers and query strings can hold passwords or tokens.
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler) {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const started = performance.now();

    return next.handle().pipe(
      finalize(() => {
        // The Docker healthcheck polls every 10s; only log it when it fails.
        if (request.path === '/health' && response.statusCode < 400) return;
        const ms = Math.round(performance.now() - started);
        this.logger.log(`${request.method} ${request.path} ${response.statusCode} ${ms}ms [${request.id}]`);
      }),
    );
  }
}
