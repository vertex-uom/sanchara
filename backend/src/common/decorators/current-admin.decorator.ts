import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { AdminProfile } from '../../modules/auth/admins/admins.service.js';

// The signed-in platform admin set by AdminGuard. Use only on @AdminOnly() routes.
export const CurrentAdmin = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AdminProfile => context.switchToHttp().getRequest<Request>().admin!,
);
