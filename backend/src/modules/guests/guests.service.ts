import { HttpStatus, Injectable } from '@nestjs/common';
import { AppException } from '../../common/errors/app-exception.js';
import { isUniqueViolation } from '../../common/prisma/db.js';
import type { Guest } from '../../generated/prisma/client.js';
import { GuestsRepository } from './guests.repository.js';

// What the API exposes about a guest.
export type GuestProfile = {
  id: string;
  fullName: string;
  email: string;
  mobile: string | null;
  emailVerified: boolean;
  createdAt: string;
};

export function toProfile(guest: Guest): GuestProfile {
  return {
    id: guest.id,
    fullName: guest.fullName,
    email: guest.email,
    mobile: guest.mobile,
    emailVerified: guest.emailVerifiedAt !== null,
    createdAt: guest.createdAt.toISOString(),
  };
}

// Guest accounts. Callers pass normalised email and mobile values.
@Injectable()
export class GuestsService {
  constructor(private readonly repository: GuestsRepository) {}

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

  async registerWithPassword(input: { fullName: string; email: string; mobile: string | null }, hash: string) {
    try {
      return await this.repository.createWithPassword(input, hash);
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
      throw new AppException(HttpStatus.CONFLICT, 'EMAIL_TAKEN', 'An account with this email already exists.', {
        email: ['An account with this email already exists.'],
      });
    }
  }

  // Returns null if another request created the same identity first.
  async registerFromGoogle(input: { fullName: string; email: string }, identity: { subject: string; email: string }) {
    try {
      return await this.repository.createFromGoogle({ ...input, mobile: null }, identity);
    } catch (error) {
      if (isUniqueViolation(error)) return null;
      throw error;
    }
  }

  async linkGoogle(guest: Guest, identity: { subject: string; email: string }) {
    try {
      return await this.repository.linkGoogle(guest.id, identity, guest.emailVerifiedAt === null);
    } catch (error) {
      if (isUniqueViolation(error)) return null;
      throw error;
    }
  }

  setPasswordHash(guestId: string, hash: string) {
    return this.repository.setPasswordHash(guestId, hash);
  }
}
