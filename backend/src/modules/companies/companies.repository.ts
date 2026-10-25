import { Injectable } from '@nestjs/common';
import type { Db } from '../../common/prisma/db.js';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import type { CompanyStatus } from '../../generated/prisma/client.js';

export type NewCompany = {
  name: string;
  subdomain: string;
  status?: CompanyStatus;
  town?: string | null;
  legalName?: string | null;
  registrationNo?: string | null;
  createdById?: string | null;
};

// Prisma access for companies. Only CompaniesService uses it.
@Injectable()
export class CompaniesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.company.findUnique({ where: { id } });
  }

  findBySubdomain(subdomain: string) {
    return this.prisma.company.findUnique({ where: { subdomain } });
  }

  // The company and the first entry of its status history, in the caller's
  // transaction or a new one.
  create(company: NewCompany, db?: Db) {
    return db ? this.insert(company, db) : this.prisma.$transaction((tx) => this.insert(company, tx));
  }

  private async insert(company: NewCompany, db: Db) {
    const created = await db.company.create({ data: company });
    await db.companyStatusChange.create({
      data: { companyId: created.id, toStatus: created.status, changedById: company.createdById ?? null },
    });
    return created;
  }

  // Moves the company from one status to another and records it. Null when the
  // company isn't in `from` (already moved, e.g. by a parallel request).
  transition(companyId: string, from: CompanyStatus, to: CompanyStatus, change: { reason?: string; changedById?: string | null }) {
    return this.prisma.$transaction(async (tx) => {
      const { count } = await tx.company.updateMany({ where: { id: companyId, status: from }, data: { status: to } });
      if (count === 0) return null;
      await tx.companyStatusChange.create({
        data: { companyId, fromStatus: from, toStatus: to, reason: change.reason, changedById: change.changedById ?? null },
      });
      return tx.company.findUnique({ where: { id: companyId } });
    });
  }
}
