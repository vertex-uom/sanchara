import { type CanActivate, type ExecutionContext, Injectable, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { bearerToken, unauthenticated } from '../../../common/security/bearer-token.js';
import { StaffGuard } from '../../staff/guards/staff.guard.js';
import { GuestGuard } from './guest.guard.js';

// Any audience: sets request.guest or request.staff. Tokens are random and each
// lives in its own audience's store, so at most one lookup matches.
@Injectable()
export class SignedInGuard implements CanActivate {
  constructor(
    private readonly guests: GuestGuard,
    private readonly staff: StaffGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = bearerToken(request);
    if (!token) throw unauthenticated();
    if ((await this.guests.attach(request, token)) || (await this.staff.attach(request, token))) return true;
    throw unauthenticated();
  }
}

// Marks a route as open to any signed-in audience.
export const SignedIn = () => UseGuards(SignedInGuard);
