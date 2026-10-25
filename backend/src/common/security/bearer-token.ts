import { HttpStatus } from '@nestjs/common';
import type { Request } from 'express';
import { AppException } from '../errors/app-exception.js';

// The Next server forwards the session token as "Authorization: Bearer <token>".
export function bearerToken(request: Request): string | null {
  const header = request.get('authorization');
  const match = header?.match(/^Bearer ([A-Za-z0-9_-]+)$/);
  return match ? match[1] : null;
}

export const unauthenticated = () => new AppException(HttpStatus.UNAUTHORIZED, 'UNAUTHENTICATED', 'Please sign in.');
