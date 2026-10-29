import { type CanActivate, type ExecutionContext, HttpStatus, Injectable, SetMetadata, UseGuards } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { AppException } from '../../../common/errors/app-exception.js';
import { bearerToken, unauthenticated } from '../../../common/security/bearer-token.js';
import { SessionService } from '../../../common/security/session.service.js';
import { CompaniesService, toCompanyProfile } from '../../companies/companies.service.js';
import { StaffService, toStaffProfile, type SignedInStaff } from '../staff.service.js';

declare module 'express' {
  interface Request {
    staff?: SignedInStaff;
  }
}

const OWNER_WHEN_SUSPENDED_KEY = 'ownerWhenSuspended';

const suspended = () =>
  new AppException(HttpStatus.FORBIDDEN, 'COMPANY_SUSPENDED', "Your company's account is suspended. Only the Owner can open billing to restore it.");

// Allows only a live staff session for an active staff account; sets request.staff.
// A suspended company's staff are refused everywhere, except the Owner on
// routes marked @OwnerWhenSuspended() (billing). /v1/me still answers them.
@Injectable()
export class StaffGuard implements CanActivate {
  constructor(
    private readonly sessions: SessionService,
    private readonly staff: StaffService,
    private readonly companies: CompaniesService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = bearerToken(request);
    if (!token || !(await this.attach(request, token))) throw unauthenticated();

    const { company, role } = request.staff!;
    if (company.status === 'suspended-by-admin' || company.status === 'suspended-non-payment') {
      const ownerAllowed = this.reflector.getAllAndOverride<boolean>(OWNER_WHEN_SUSPENDED_KEY, [context.getHandler(), context.getClass()]);
      if (!(ownerAllowed && role === 'owner')) throw suspended();
    }
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

// Lets a suspended company's Owner use this route (billing, to pay and restore access).
export const OwnerWhenSuspended = () => SetMetadata(OWNER_WHEN_SUSPENDED_KEY, true);
