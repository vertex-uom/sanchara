import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { GuestProfile } from '../../modules/guests/guests.service.js';

// The signed-in guest set by GuestGuard. Use only on @GuestOnly() routes.
export const CurrentGuest = createParamDecorator(
  (_data: unknown, context: ExecutionContext): GuestProfile => context.switchToHttp().getRequest<Request>().guest!,
);
