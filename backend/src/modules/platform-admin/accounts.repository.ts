import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import type { CompanyStatus, Prisma } from '../../generated/prisma/client.js';

const SUSPENDED: CompanyStatus[] = ['SUSPENDED_BY_ADMIN', 'SUSPENDED_NON_PAYMENT'];
const SEATED = { status: { in: ['ACTIVE' as const, 'INVITED' as const] } };

const ROW_SELECT = {
  id: true,
  name: true,
  subdomain: true,
  town: true,
  status: true,
  createdAt: true,
  subscriptions: { where: { endedAt: null }, select: { plan: { select: { code: true, name: true } } } },
  properties: { orderBy: [{ createdAt: 'asc' }, { id: 'asc' }], take: 1, select: { city: true } },
  _count: { select: { properties: true, staff: { where: SEATED } } },
} as const satisfies Prisma.CompanySelect;

const DETAIL_SELECT = {
  ...ROW_SELECT,
  legalName: true,
  registrationNo: true,
  subscriptions: {
    where: { endedAt: null },
    select: { status: true, startedAt: true, plan: { select: { code: true, name: true } } },
  },
  properties: { orderBy: [{ createdAt: 'asc' }, { id: 'asc' }], select: { id: true, name: true, city: true, status: true } },
  staff: { select: { role: true, status: true, fullName: true, email: true, phone: true } },
  websiteAssistanceRequests: { where: { status: { in: ['REQUESTED', 'IN_PROGRESS', 'REVIEW'] } }, select: { id: true } },
} as const satisfies Prisma.CompanySelect;

export type CompanyRowRecord = Prisma.CompanyGetPayload<{ select: typeof ROW_SELECT }>;
export type CompanyDetailRecord = Prisma.CompanyGetPayload<{ select: typeof DETAIL_SELECT }>;

export type CompanyListFilters = {
  q?: string;
  statuses?: CompanyStatus[];
  planCode?: string;
  town?: string;
  joinedAfter?: Date;
  sort: 'newest' | 'oldest' | 'name';
};

const ENFORCEMENT_WHERE: Prisma.CompanyStatusChangeWhereInput = {
  OR: [{ toStatus: { in: SUSPENDED } }, { fromStatus: { in: SUSPENDED }, toStatus: 'ACTIVE' }],
};

const ENFORCEMENT_SELECT = {
  id: true,
  fromStatus: true,
  toStatus: true,
  reason: true,
  changedAt: true,
  company: { select: { id: true, name: true } },
  changedBy: { select: { fullName: true } },
} as const satisfies Prisma.CompanyStatusChangeSelect;

export type EnforcementRecord = Prisma.CompanyStatusChangeGetPayload<{ select: typeof ENFORCEMENT_SELECT }>;

// Read queries for the Accounts & Enforcement tab. Status changes go through CompaniesService.
@Injectable()
export class AccountsRepository {
  constructor(private readonly prisma: PrismaService) {}

  private where({ q, statuses, planCode, town, joinedAfter }: CompanyListFilters): Prisma.CompanyWhereInput {
    return {
      ...(statuses ? { status: { in: statuses } } : {}),
      ...(planCode ? { subscriptions: { some: { endedAt: null, plan: { code: planCode } } } } : {}),
      ...(town ? { town } : {}),
      ...(joinedAfter ? { createdAt: { gte: joinedAfter } } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { subdomain: { contains: q, mode: 'insensitive' } },
              { town: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
  }

  async listCompanies(filters: CompanyListFilters, skip: number, take: number) {
    const orderBy: Prisma.CompanyOrderByWithRelationInput[] =
      filters.sort === 'name' ? [{ name: 'asc' }, { id: 'asc' }] : [{ createdAt: filters.sort === 'newest' ? 'desc' : 'asc' }, { id: 'asc' }];
    const where = this.where(filters);
    const [rows, total] = await Promise.all([
      this.prisma.company.findMany({ where, orderBy, skip, take, select: ROW_SELECT }),
      this.prisma.company.count({ where }),
    ]);
    return { rows, total };
  }

  findCompany(id: string): Promise<CompanyDetailRecord | null> {
    return this.prisma.company.findUnique({ where: { id }, select: DETAIL_SELECT });
  }

  async statusCounts() {
    const groups = await this.prisma.company.groupBy({ by: ['status'], _count: { _all: true } });
    const counts: Record<CompanyStatus, number> = { PENDING_SETUP: 0, ACTIVE: 0, SUSPENDED_BY_ADMIN: 0, SUSPENDED_NON_PAYMENT: 0 };
    for (const group of groups) counts[group.status] = group._count._all;
    return counts;
  }

  countJoinedSince(since: Date) {
    return this.prisma.company.count({ where: { createdAt: { gte: since } } });
  }

  async towns(): Promise<string[]> {
    const rows = await this.prisma.company.findMany({ where: { town: { not: null } }, distinct: ['town'], select: { town: true }, orderBy: { town: 'asc' } });
    return rows.map((row) => row.town!);
  }

  plans() {
    return this.prisma.plan.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' }, select: { code: true, name: true } });
  }

  // Suspensions and reactivations, newest first; one company's when companyId is given.
  async enforcement(skip: number, take: number, companyId?: string) {
    const where = { ...ENFORCEMENT_WHERE, ...(companyId ? { companyId } : {}) };
    const [rows, total] = await Promise.all([
      this.prisma.companyStatusChange.findMany({ where, orderBy: [{ changedAt: 'desc' }, { id: 'desc' }], skip, take, select: ENFORCEMENT_SELECT }),
      this.prisma.companyStatusChange.count({ where }),
    ]);
    return { rows, total };
  }
}
