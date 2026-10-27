import { type CanActivate, type ExecutionContext, Injectable, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { bearerToken, unauthenticated } from '../../../common/security/bearer-token.js';
import { SessionService } from '../../../common/security/session.service.js';
import { CompaniesService, toCompanyProfile } from '../../companies/companies.service.js';
import { StaffService, toStaffProfile, type SignedInStaff } from '../staff.service.js';

declare module 'express' {
  interface Request {
    staff?: SignedInStaff;
  }
}

// Allows only a live staff session for an active staff account; sets request.staff.
// Company suspension is not checked here: suspended Owners still reach billing.
@Injectable()
export class StaffGuard implements CanActivate {
  constructor(
    private readonly sessions: SessionService,
    private readonly staff: StaffService,
    private readonly companies: CompaniesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = bearerToken(request);
    if (!token || !(await this.attach(request, token))) throw unauthenticated();
    return true;
  }

  // Sets request.staff when the token is a live session of an active staff account.
  async attach(request: Request, token: string): Promise<boolean> {
    const session = await this.sessions.resolve('staff', token);
    if (!session) return false;

    const staff = await this.staff.findById(session.subjectId);
    const company = staff?.status === 'ACTIVE' ? await this.companies.findById(staff.companyId) : null;
    if (!staff || !company) {
      await this.sessions.destroy('staff', token);
      return false;
    }
    request.staff = { ...toStaffProfile(staff), company: toCompanyProfile(company) };
    return true;
  }
}

// Marks a route (or controller) as staff-only.
export const StaffOnly = () => UseGuards(StaffGuard);
