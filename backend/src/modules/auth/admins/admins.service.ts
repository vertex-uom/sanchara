import { HttpStatus, Injectable } from '@nestjs/common';
import { AppException } from '../../../common/errors/app-exception.js';
import { isUniqueViolation } from '../../../common/prisma/db.js';
import type { AdminStatus, PlatformAdmin } from '../../../generated/prisma/client.js';
import { AdminsRepository } from './admins.repository.js';

// What the API exposes about a platform admin.
export type AdminProfile = { id: string; fullName: string; email: string };

export function toAdminProfile(admin: PlatformAdmin): AdminProfile {
  return { id: admin.id, fullName: admin.fullName, email: admin.email };
}

export const ADMIN_PAGE_SIZE = 10;

// Audit entries about admin accounts (entity type ADMIN_ENTITY). Only `created`
// is recorded so far (src/create-admin.ts); the others come with the invite and
// deactivate features.
export const ADMIN_ENTITY = 'platform_admin';
export const ADMIN_ACTIONS = {
  added: 'platform_admin.created',
  invited: 'platform_admin.invited',
  activated: 'platform_admin.activated',
  deactivated: 'platform_admin.deactivated',
  reactivated: 'platform_admin.reactivated',
} as const;

// A Google account was linked to an admin on its first Google sign-in.
export const ADMIN_GOOGLE_LINKED = 'platform_admin.google_linked';

const STATUS_NAMES: Record<AdminStatus, 'active' | 'deactivated'> = { ACTIVE: 'active', DISABLED: 'deactivated' };

// One row of the Admin Users list. Two-step verification isn't built yet, so
// nobody is enrolled.
export function toAdminListItem(admin: PlatformAdmin) {
  return {
    id: admin.id,
    fullName: admin.fullName,
    email: admin.email,
    status: STATUS_NAMES[admin.status],
    twoStepEnabled: false,
    lastSignInAt: admin.lastSignInAt?.toISOString() ?? null,
    createdAt: admin.createdAt.toISOString(),
  };
}

// Platform admin accounts (the platform team). Created from the command line
// for now (src/create-admin.ts); callers pass normalised emails.
@Injectable()
export class AdminsService {
  constructor(private readonly repository: AdminsRepository) {}

  findById(id: string) {
    return this.repository.findById(id);
  }

  // id → full name, for the given admins that still exist.
  async namesByIds(ids: string[]): Promise<Map<string, string>> {
    if (ids.length === 0) return new Map();
    const admins = await this.repository.findNames(ids);
    return new Map(admins.map((admin) => [admin.id, admin.fullName]));
  }

  findByEmail(email: string) {
    return this.repository.findByEmail(email);
  }

  findByGoogleSubject(subject: string) {
    return this.repository.findByGoogleSubject(subject);
  }

  // False when the Google account is already linked (e.g. a parallel callback won).
  async linkGoogle(admin: PlatformAdmin, identity: { subject: string; email: string }) {
    try {
      await this.repository.linkGoogle(admin.id, identity);
      return true;
    } catch (error) {
      if (isUniqueViolation(error)) return false;
      throw error;
    }
  }

  findByEmailWithPassword(email: string) {
    return this.repository.findByEmailWithPassword(email);
  }

  // A page of admins plus how many there are in each status.
  async list(page: number) {
    const groups = await this.repository.countByStatus();
    const counts = { all: 0, active: 0, deactivated: 0 };
    for (const group of groups) {
      counts[STATUS_NAMES[group.status]] += group._count._all;
      counts.all += group._count._all;
    }
    const safePage = Math.min(Math.max(page, 1), Math.max(Math.ceil(counts.all / ADMIN_PAGE_SIZE), 1));
    const admins = await this.repository.list((safePage - 1) * ADMIN_PAGE_SIZE, ADMIN_PAGE_SIZE);
    return { items: admins.map(toAdminListItem), total: counts.all, page: safePage, pageSize: ADMIN_PAGE_SIZE, counts };
  }

  async create(input: { fullName: string; email: string }, hash: string) {
    try {
      return await this.repository.createWithPassword(input, hash);
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
      throw new AppException(HttpStatus.CONFLICT, 'EMAIL_TAKEN', 'An admin with this email already exists.', {
        email: ['An admin with this email already exists.'],
      });
    }
  }

  recordSignIn(adminId: string) {
    return this.repository.recordSignIn(adminId);
  }

  setPasswordHash(adminId: string, hash: string) {
    return this.repository.setPasswordHash(adminId, hash);
  }
}
