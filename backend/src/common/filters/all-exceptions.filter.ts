import { type ArgumentsHost, Catch, type ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AppException, type ErrorBody } from '../errors/app-exception.js';

// Fallback codes for Nest's built-in exceptions (404 route, 413 body, ...).
const STATUS_CODES: Record<number, string> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHENTICATED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  413: 'PAYLOAD_TOO_LARGE',
  429: 'TOO_MANY_REQUESTS',
};

// Maps every error to { status, code, message, fieldErrors }. Unknown errors
// become a plain 500; details go to the log (with the request id), never the client.
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exceptions');

  catch(exception: unknown, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();

    const body = this.toBody(exception);
    if (body.status >= 500) {
      this.logger.error(
        `${request.method} ${request.path} failed [${request.id}]`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    if (exception instanceof AppException && exception.headers) {
      for (const [name, value] of Object.entries(exception.headers)) response.setHeader(name, value);
    }
    response.status(body.status).json(body);
  }

  private toBody(exception: unknown): ErrorBody {
    if (exception instanceof AppException) {
      return {
        status: exception.getStatus(),
        code: exception.code,
        message: exception.message,
        ...(exception.fieldErrors ? { fieldErrors: exception.fieldErrors } : {}),
      };
    }
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      if (status < 500) {
        return { status, code: STATUS_CODES[status] ?? 'REQUEST_FAILED', message: exception.message };
      }
    }
    return { status: HttpStatus.INTERNAL_SERVER_ERROR, code: 'INTERNAL_ERROR', message: 'Something went wrong.' };
  }
}
