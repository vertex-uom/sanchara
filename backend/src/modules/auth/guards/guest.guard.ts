import { type CanActivate, type ExecutionContext, HttpStatus, Injectable, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AppException } from '../../../common/errors/app-exception.js';
import { GuestsService, toProfile, type GuestProfile } from '../../guests/guests.service.js';
import { SessionService } from '../services/session.service.js';

declare module 'express' {
  interface Request {
    guest?: GuestProfile;
  }
}

// The Next server forwards the session token as "Authorization: Bearer <token>".
export function bearerToken(request: Request): string | null {
  const header = request.get('authorization');
  const match = header?.match(/^Bearer ([A-Za-z0-9_-]+)$/);
  return match ? match[1] : null;
}

const unauthenticated = () => new AppException(HttpStatus.UNAUTHORIZED, 'UNAUTHENTICATED', 'Please sign in.');

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
    const session = token ? await this.sessions.resolve('guest', token) : null;
    if (!session) throw unauthenticated();

    const guest = await this.guests.findById(session.subjectId);
    if (!guest || guest.status !== 'ACTIVE') {
      await this.sessions.destroy('guest', token!);
      throw unauthenticated();
    }
    request.guest = toProfile(guest);
    return true;
  }
}

// Marks a route (or controller) as guest-only.
export const GuestOnly = () => UseGuards(GuestGuard);
