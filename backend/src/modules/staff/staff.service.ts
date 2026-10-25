import { HttpStatus, Injectable } from '@nestjs/common';
import { AppException } from '../../common/errors/app-exception.js';
import type { Staff, StaffRole } from '../../generated/prisma/client.js';
import type { CompanyProfile } from '../companies/companies.service.js';
import { StaffRepository } from './staff.repository.js';

export type StaffRoleName = 'owner' | 'manager' | 'front-desk';
export type StaffStatusName = 'invited' | 'active' | 'inactive';

// What the API exposes about a staff account.
export type StaffProfile = {
  id: string;
  fullName: string;
  email: string;
  role: StaffRoleName;
  status: StaffStatusName;
  createdAt: string;
};

// The signed-in staff member and their company, set by StaffGuard.
export type SignedInStaff = StaffProfile & { company: CompanyProfile };

export const ROLE_NAMES = {
  OWNER: 'owner',
  MANAGER: 'manager',
  FRONT_DESK: 'front-desk',
} as const satisfies Record<StaffRole, StaffRoleName>;

export const ROLES_BY_NAME: Record<StaffRoleName, StaffRole> = {
  owner: 'OWNER',
  manager: 'MANAGER',
  'front-desk': 'FRONT_DESK',
};

export const ROLE_LABELS: Record<StaffRole, string> = { OWNER: 'Owner', MANAGER: 'Manager', FRONT_DESK: 'Front Desk' };

const STATUS_NAMES = {
  INVITED: 'invited',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const satisfies Record<Staff['status'], StaffStatusName>;

export function toStaffProfile(staff: Staff): StaffProfile {
  return {
    id: staff.id,
    fullName: staff.fullName,
    email: staff.email,
    role: ROLE_NAMES[staff.role],
    status: STATUS_NAMES[staff.status],
    createdAt: staff.createdAt.toISOString(),
  };
}

// Prisma's unique-constraint error, matched by code so no runtime import is needed.
function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: unknown }).code === 'P2002';
}

// Staff accounts. Callers pass normalised email values.
@Injectable()
export class StaffService {
  constructor(private readonly repository: StaffRepository) {}

  findById(id: string) {
    return this.repository.findById(id);
  }

  findByEmail(email: string) {
    return this.repository.findByEmail(email);
  }

  findByEmailWithPassword(email: string) {
    return this.repository.findByEmailWithPassword(email);
  }

  findByGoogleSubject(subject: string) {
    return this.repository.findByGoogleSubject(subject);
  }

  async createInvited(input: { companyId: string; fullName: string; email: string; role: StaffRole }) {
    try {
      return await this.repository.createInvited(input);
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
      throw new AppException(HttpStatus.CONFLICT, 'EMAIL_TAKEN', 'A staff account with this email already exists.', {
        email: ['A staff account with this email already exists.'],
      });
    }
  }

  activate(staffId: string, hash: string) {
    return this.repository.activate(staffId, hash);
  }

  // Returns false if this Google account is already linked (e.g. a parallel callback).
  async linkGoogle(staff: Staff, identity: { subject: string; email: string }) {
    try {
      await this.repository.linkGoogle(staff.id, identity);
      return true;
    } catch (error) {
      if (isUniqueViolation(error)) return false;
      throw error;
    }
  }

  setPasswordHash(staffId: string, hash: string) {
    return this.repository.setPasswordHash(staffId, hash);
  }
}
