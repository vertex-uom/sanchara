import { HttpStatus, Injectable } from '@nestjs/common';
import { AppException } from '../../common/errors/app-exception.js';
import type { Company } from '../../generated/prisma/client.js';
import { CompaniesRepository } from './companies.repository.js';

export type CompanyStatusName = 'active' | 'suspended-non-payment' | 'suspended-by-admin';

// What the API exposes about a company.
export type CompanyProfile = { id: string; name: string; subdomain: string; status: CompanyStatusName };

const STATUS_NAMES = {
  ACTIVE: 'active',
  SUSPENDED_NON_PAYMENT: 'suspended-non-payment',
  SUSPENDED_BY_ADMIN: 'suspended-by-admin',
} as const satisfies Record<Company['status'], CompanyStatusName>;

export function toCompanyProfile(company: Company): CompanyProfile {
  return { id: company.id, name: company.name, subdomain: company.subdomain, status: STATUS_NAMES[company.status] };
}

// Prisma's unique-constraint error, matched by code so no runtime import is needed.
function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: unknown }).code === 'P2002';
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

  async create(input: { name: string; subdomain: string }) {
    try {
      return await this.repository.create(input);
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
      throw new AppException(HttpStatus.CONFLICT, 'SUBDOMAIN_TAKEN', 'This subdomain is already in use.', {
        subdomain: ['This subdomain is already in use.'],
      });
    }
  }
}
