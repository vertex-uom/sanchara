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

// Companies (tenants). The status state machine is added with suspension.
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
  // Null when the company wasn't waiting for setup (nothing changes).
  completeSetup(companyId: string) {
    return this.repository.transition(companyId, 'PENDING_SETUP', 'ACTIVE', { reason: 'Owner accepted the invite.' });
  }
}
