import { randomUUID } from 'node:crypto';
import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

declare module 'express' {
  interface Request {
    id: string;
  }
}

// Keeps a caller's id (e.g. from the Next server) if it looks safe, otherwise makes one.
const SAFE_ID = /^[A-Za-z0-9._-]{8,64}$/;

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(request: Request, response: Response, next: NextFunction) {
    const incoming = request.get('x-request-id');
    request.id = incoming && SAFE_ID.test(incoming) ? incoming : randomUUID();
    response.setHeader('X-Request-Id', request.id);
    next();
  }
}
