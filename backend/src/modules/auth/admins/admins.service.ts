import { HttpStatus, Injectable } from '@nestjs/common';
import { AppException } from '../../../common/errors/app-exception.js';
import { isUniqueViolation } from '../../../common/prisma/db.js';
import type { PlatformAdmin } from '../../../generated/prisma/client.js';
import { AdminsRepository } from './admins.repository.js';

// What the API exposes about a platform admin.
export type AdminProfile = { id: string; fullName: string; email: string };

export function toAdminProfile(admin: PlatformAdmin): AdminProfile {
  return { id: admin.id, fullName: admin.fullName, email: admin.email };
}

// Platform admin accounts (the platform team). Created from the command line
// for now (src/create-admin.ts); callers pass normalised emails.
@Injectable()
export class AdminsService {
  constructor(private readonly repository: AdminsRepository) {}

  findById(id: string) {
    return this.repository.findById(id);
  }

  findByEmailWithPassword(email: string) {
    return this.repository.findByEmailWithPassword(email);
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
