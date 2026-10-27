import { type CanActivate, type ExecutionContext, Injectable, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { bearerToken, unauthenticated } from '../../../common/security/bearer-token.js';
import { SessionService } from '../../../common/security/session.service.js';
import { GuestsService, toProfile, type GuestProfile } from '../../guests/guests.service.js';

declare module 'express' {
  interface Request {
    guest?: GuestProfile;
  }
}

// Allows only a live guest session for an active guest; sets request.guest.
@Injectable()
export class GuestGuard implements CanActivate {
  constructor(
    private readonly sessions: SessionService,
    private readonly guests: GuestsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = bearerToken(request);
    if (!token || !(await this.attach(request, token))) throw unauthenticated();
    return true;
  }

  // Sets request.guest when the token is a live session of an active guest.
  async attach(request: Request, token: string): Promise<boolean> {
    const session = await this.sessions.resolve('guest', token);
    if (!session) return false;

    const guest = await this.guests.findById(session.subjectId);
    if (!guest || guest.status !== 'ACTIVE') {
      await this.sessions.destroy('guest', token);
      return false;
    }
    request.guest = toProfile(guest);
    return true;
  }
}

// Marks a route (or controller) as guest-only.
export const GuestOnly = () => UseGuards(GuestGuard);
