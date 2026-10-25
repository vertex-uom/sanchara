import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { SignedInStaff } from '../../modules/staff/staff.service.js';

// The signed-in staff member set by StaffGuard. Use only on @StaffOnly() routes.
export const CurrentStaff = createParamDecorator(
  (_data: unknown, context: ExecutionContext): SignedInStaff => context.switchToHttp().getRequest<Request>().staff!,
);
