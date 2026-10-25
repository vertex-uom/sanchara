import { type CanActivate, type ExecutionContext, Injectable, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { bearerToken, unauthenticated } from '../../../common/security/bearer-token.js';
import { SessionService } from '../../../common/security/session.service.js';
import { AdminsService, toAdminProfile, type AdminProfile } from '../admins/admins.service.js';

declare module 'express' {
  interface Request {
    admin?: AdminProfile;
  }
}

// Allows only a live admin session for an active platform admin; sets request.admin.
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private readonly sessions: SessionService,
    private readonly admins: AdminsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = bearerToken(request);
    if (!token || !(await this.attach(request, token))) throw unauthenticated();
    return true;
  }

  // Sets request.admin when the token is a live session of an active admin.
  async attach(request: Request, token: string): Promise<boolean> {
    const session = await this.sessions.resolve('admin', token);
    if (!session) return false;

    const admin = await this.admins.findById(session.subjectId);
    if (!admin || admin.status !== 'ACTIVE') {
      await this.sessions.destroy('admin', token);
      return false;
    }
    request.admin = toAdminProfile(admin);
    return true;
  }
}

// Marks a route (or controller) as platform-admin-only.
export const AdminOnly = () => UseGuards(AdminGuard);
