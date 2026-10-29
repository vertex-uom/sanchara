import { HttpStatus, Injectable } from '@nestjs/common';
import { AppConfig } from '../../common/config/app-config.service.js';
import { AppException } from '../../common/errors/app-exception.js';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { toApiName } from '../../common/validation/api-names.js';
import type { CompanyStatus } from '../../generated/prisma/client.js';
import { AuditService } from '../audit/audit.service.js';
import type { AdminProfile } from '../auth/admins/admins.service.js';
import { CompaniesService, type CompanyStatusName } from '../companies/companies.service.js';
import { AccountsRepository, type CompanyDetailRecord, type CompanyRowRecord, type EnforcementRecord } from './accounts.repository.js';
import type { CompanyStatusFilter } from './dto/accounts.dto.js';

export const COMPANY_PAGE_SIZE = 8;

export type CompanyRow = {
  id: string;
  name: string;
  subdomain: string;
  location: string;
  plan: { code: string; name: string } | null;
  propertyCount: number;
  // Active and invited accounts.
  staffCount: number;
  status: CompanyStatusName;
  joinedAt: string;
};

export type EnforcementKind = 'suspended' | 'reactivated' | 'suspended-nonpayment' | 'reactivated-payment';

export type EnforcementEntry = {
  id: string;
  companyId: string;
  companyName: string;
  kind: EnforcementKind;
  reason: string;
  // An admin's name, or "System".
  actor: string;
  occurredAt: string;
};

export type CompanyDetail = CompanyRow & {
  legalName: string | null;
  registrationNo: string | null;
  owner: { name: string; email: string; phone: string | null; status: string } | null;
  subscription: { status: string; planName: string; startedAt: string } | null;
  properties: { id: string; name: string; city: string; status: string }[];
  staff: { owners: number; managers: number; frontDesk: number };
  siteHosts: string[];
  // Open WEMIXT website request, if any.
  websiteRequestId: string | null;
  // Newest first.
  history: EnforcementEntry[];
};

type Paged<T> = { items: T[]; total: number; page: number; pageSize: number };

type ListQuery = { q?: string; status?: CompanyStatusFilter; plan?: string; town?: string; joinedAfter?: string; sort?: 'newest' | 'oldest' | 'name'; page?: number };

const STATUS_FILTERS: Record<CompanyStatusFilter, CompanyStatus[] | undefined> = {
  all: undefined,
  active: ['ACTIVE'],
  'pending-setup': ['PENDING_SETUP'],
  suspended: ['SUSPENDED_BY_ADMIN', 'SUSPENDED_NON_PAYMENT'],
  'suspended-by-admin': ['SUSPENDED_BY_ADMIN'],
  'suspended-non-payment': ['SUSPENDED_NON_PAYMENT'],
};

const notFound = () => new AppException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'That company no longer exists.');

const seated = (status: string) => status === 'ACTIVE' || status === 'INVITED';

function toRow(company: CompanyRowRecord | CompanyDetailRecord): CompanyRow {
  const plan = company.subscriptions[0]?.plan ?? null;
  return {
    id: company.id,
    name: company.name,
    subdomain: company.subdomain,
    location: company.town ?? company.properties[0]?.city ?? '',
    plan,
    propertyCount: company._count.properties,
    staffCount: company._count.staff,
    status: toApiName(company.status) as CompanyStatusName,
    joinedAt: company.createdAt.toISOString(),
  };
}

function enforcementKind(change: EnforcementRecord): EnforcementKind {
  if (change.toStatus === 'SUSPENDED_BY_ADMIN') return 'suspended';
  if (change.toStatus === 'SUSPENDED_NON_PAYMENT') return 'suspended-nonpayment';
  return change.fromStatus === 'SUSPENDED_NON_PAYMENT' && !change.changedBy ? 'reactivated-payment' : 'reactivated';
}

function toEntry(change: EnforcementRecord): EnforcementEntry {
  return {
    id: change.id,
    companyId: change.company.id,
    companyName: change.company.name,
    kind: enforcementKind(change),
    reason: change.reason ?? '',
    actor: change.changedBy?.fullName ?? 'System',
    occurredAt: change.changedAt.toISOString(),
  };
}

// Platform Admin: companies and their enforcement (suspend / reactivate).
// Never reads bookings, guests, enquiries or payments.
@Injectable()
export class AccountsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repository: AccountsRepository,
    private readonly companies: CompaniesService,
    private readonly audit: AuditService,
    private readonly config: AppConfig,
  ) {}

  async list(query: ListQuery): Promise<Paged<CompanyRow>> {
    const page = query.page ?? 1;
    const { rows, total } = await this.repository.listCompanies(
      {
        q: query.q,
        statuses: STATUS_FILTERS[query.status ?? 'all'],
        planCode: query.plan,
        town: query.town,
        joinedAfter: query.joinedAfter ? new Date(query.joinedAfter) : undefined,
        sort: query.sort ?? 'newest',
      },
      (page - 1) * COMPANY_PAGE_SIZE,
      COMPANY_PAGE_SIZE,
    );
    return { items: rows.map(toRow), total, page, pageSize: COMPANY_PAGE_SIZE };
  }

  async summary() {
    const [counts, joinedLast30Days] = await Promise.all([
      this.repository.statusCounts(),
      this.repository.countJoinedSince(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
    ]);
    return {
      total: counts.ACTIVE + counts.PENDING_SETUP + counts.SUSPENDED_BY_ADMIN + counts.SUSPENDED_NON_PAYMENT,
      active: counts.ACTIVE,
      pendingSetup: counts.PENDING_SETUP,
      suspendedByAdmin: counts.SUSPENDED_BY_ADMIN,
      suspendedNonPayment: counts.SUSPENDED_NON_PAYMENT,
      joinedLast30Days,
    };
  }

  async options() {
    const [towns, plans] = await Promise.all([this.repository.towns(), this.repository.plans()]);
    return { towns, plans };
  }

  async detail(id: string): Promise<CompanyDetail> {
    const company = await this.repository.findCompany(id);
    if (!company) throw notFound();
    const { rows } = await this.repository.enforcement(0, 50, id);
    const owner = company.staff.find((member) => member.role === 'OWNER');
    const subscription = company.subscriptions[0];
    const count = (role: string) => company.staff.filter((member) => member.role === role && seated(member.status)).length;
    return {
      ...toRow(company),
      legalName: company.legalName,
      registrationNo: company.registrationNo,
      owner: owner ? { name: owner.fullName, email: owner.email, phone: owner.phone, status: toApiName(owner.status) } : null,
      subscription: subscription ? { status: toApiName(subscription.status), planName: subscription.plan.name, startedAt: subscription.startedAt.toISOString() } : null,
      properties: company.properties.map((property) => ({ id: property.id, name: property.name, city: property.city, status: toApiName(property.status) })),
      staff: { owners: count('OWNER'), managers: count('MANAGER'), frontDesk: count('FRONT_DESK') },
      siteHosts: [`${company.subdomain}.${this.config.platformDomain}`],
      websiteRequestId: company.websiteAssistanceRequests[0]?.id ?? null,
      history: rows.map(toEntry),
    };
  }

  async enforcementLog(page: number): Promise<Paged<EnforcementEntry>> {
    const { rows, total } = await this.repository.enforcement((page - 1) * COMPANY_PAGE_SIZE, COMPANY_PAGE_SIZE);
    return { items: rows.map(toEntry), total, page, pageSize: COMPANY_PAGE_SIZE };
  }

  // Staff of a suspended company are refused by the API until it is reactivated.
  async suspend(admin: AdminProfile, id: string, reason: string): Promise<CompanyDetail> {
    await this.changeStatus(admin, id, reason, 'company.suspended');
    return this.detail(id);
  }

  async reactivate(admin: AdminProfile, id: string, reason: string): Promise<CompanyDetail> {
    await this.changeStatus(admin, id, reason, 'company.reactivated');
    return this.detail(id);
  }

  private async changeStatus(admin: AdminProfile, id: string, reason: string, action: 'company.suspended' | 'company.reactivated') {
    const company = await this.companies.findById(id);
    if (!company) throw notFound();
    await this.prisma.$transaction(async (tx) => {
      const change = { reason, changedById: admin.id };
      const moved = action === 'company.suspended' ? await this.companies.suspendByAdmin(company, change, tx) : await this.companies.reactivate(company, change, tx);
      await this.audit.record(
        {
          actor: { type: 'PLATFORM_ADMIN', id: admin.id },
          action,
          entity: { type: 'company', id },
          companyId: id,
          details: { from: toApiName(company.status), to: toApiName(moved.status), reason },
        },
        tx,
      );
    });
  }
}
