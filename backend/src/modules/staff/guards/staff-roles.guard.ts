import { applyDecorators, type CanActivate, type ExecutionContext, HttpStatus, Injectable, SetMetadata, UseGuards } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { AppException } from '../../../common/errors/app-exception.js';
import type { StaffRoleName } from '../staff.service.js';
import { StaffGuard } from './staff.guard.js';

const STAFF_ROLES_KEY = 'staffRoles';

const ROLE_WORDS: Record<StaffRoleName, string> = { owner: 'the Owner', manager: 'a Manager', 'front-desk': 'Front Desk staff' };

// Runs after StaffGuard: the signed-in staff member must have one of the route's roles.
@Injectable()
export class StaffRolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<StaffRoleName[]>(STAFF_ROLES_KEY, [context.getHandler(), context.getClass()]);
    const role = context.switchToHttp().getRequest<Request>().staff?.role;
    if (!role || !roles.includes(role)) {
      const who = roles.map((name) => ROLE_WORDS[name]).join(' or ');
      throw new AppException(HttpStatus.FORBIDDEN, 'FORBIDDEN', `Only ${who} can do this.`);
    }
    return true;
  }
}

// Marks a route as open to these staff roles only (a live staff session with
// one of them). Use instead of @StaffOnly(), not together with it.
export const StaffRoles = (...roles: StaffRoleName[]) => applyDecorators(SetMetadata(STAFF_ROLES_KEY, roles), UseGuards(StaffGuard, StaffRolesGuard));

export const OwnerOnly = () => StaffRoles('owner');
