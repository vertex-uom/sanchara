import { HttpStatus, Injectable } from '@nestjs/common';
import { AppException } from '../../common/errors/app-exception.js';
import { isUniqueViolation, type Db } from '../../common/prisma/db.js';
import type { Company } from '../../generated/prisma/client.js';
import { CompaniesRepository, type NewCompany } from './companies.repository.js';

export type CompanyStatusName = 'pending-setup' | 'active' | 'suspended-non-payment' | 'suspended-by-admin';

// What the API exposes about a company.
export type CompanyProfile = { id: string; name: string; subdomain: string; status: CompanyStatusName };

const STATUS_NAMES = {
  PENDING_SETUP: 'pending-setup',
  ACTIVE: 'active',
  SUSPENDED_NON_PAYMENT: 'suspended-non-payment',
  SUSPENDED_BY_ADMIN: 'suspended-by-admin',
} as const satisfies Record<Company['status'], CompanyStatusName>;

export function toCompanyProfile(company: Company): CompanyProfile {
  return { id: company.id, name: company.name, subdomain: company.subdomain, status: STATUS_NAMES[company.status] };
}

// Companies (tenants) and their status state machine:
// PENDING_SETUP → ACTIVE (Owner accepts) ⇄ SUSPENDED_BY_ADMIN / SUSPENDED_NON_PAYMENT.
@Injectable()
export class CompaniesService {
  constructor(private readonly repository: CompaniesRepository) {}

  findById(id: string) {
    return this.repository.findById(id);
  }

  findBySubdomain(subdomain: string) {
    return this.repository.findBySubdomain(subdomain);
  }

  // Pass `db` to create the company inside a caller's transaction.
  async create(input: NewCompany, db?: Db) {
    try {
      return await this.repository.create(input, db);
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
      throw new AppException(HttpStatus.CONFLICT, 'SUBDOMAIN_TAKEN', 'This subdomain is already in use.', {
        subdomain: ['This subdomain is already in use.'],
      });
    }
  }

  // The Owner accepted the invite of a company the platform team created.
  // Null when the company wasn't waiting for setup (nothing changes). Pass `db`
  // to join a caller's transaction.
  completeSetup(companyId: string, db?: Db) {
    return this.repository.transition(companyId, 'PENDING_SETUP', 'ACTIVE', { reason: 'Owner accepted the invite.' }, db);
  }

  // A platform admin suspends an active company. Its staff are refused until
  // it is reactivated.
  async suspendByAdmin(company: Company, change: { reason: string; changedById: string }, db?: Db) {
    if (company.status !== 'ACTIVE') throw invalidTransition('Only an active company can be suspended.');
    const moved = await this.repository.transition(company.id, 'ACTIVE', 'SUSPENDED_BY_ADMIN', change, db);
    if (!moved) throw changedMeanwhile();
    return moved;
  }

  // A platform admin lifts their suspension. A non-payment suspension is lifted
  // only by paying (not by hand).
  async reactivate(company: Company, change: { reason: string; changedById: string }, db?: Db) {
    if (company.status !== 'SUSPENDED_BY_ADMIN') throw invalidTransition('Only a company suspended by an admin can be reactivated here.');
    const moved = await this.repository.transition(company.id, 'SUSPENDED_BY_ADMIN', 'ACTIVE', change, db);
    if (!moved) throw changedMeanwhile();
    return moved;
  }
}

const invalidTransition = (message: string) => new AppException(HttpStatus.CONFLICT, 'INVALID_STATUS', message);
const changedMeanwhile = () => new AppException(HttpStatus.CONFLICT, 'CONFLICT', 'The company was changed meanwhile. Reload and try again.');
