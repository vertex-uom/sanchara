import { applyDecorators, type CanActivate, type ExecutionContext, HttpStatus, Injectable, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AppException } from '../../../common/errors/app-exception.js';
import { StaffGuard } from './staff.guard.js';

// Runs after StaffGuard: the signed-in staff member must be the company's Owner.
@Injectable()
export class OwnerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    if (context.switchToHttp().getRequest<Request>().staff?.role !== 'owner') {
      throw new AppException(HttpStatus.FORBIDDEN, 'FORBIDDEN', 'Only the Owner can do this.');
    }
    return true;
  }
}

// Marks a route as Owner-only (a live staff session of an Owner). Use instead
// of @StaffOnly(), not together with it.
export const OwnerOnly = () => applyDecorators(UseGuards(StaffGuard, OwnerGuard));
