import { Injectable } from '@nestjs/common';
import type { Db } from '../../common/prisma/db.js';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import type { Prisma, WebsiteAssistanceStatus } from '../../generated/prisma/client.js';
import { OPEN_STATUSES } from './website-assistance.policy.js';

const ROW = {
  company: { select: { id: true, name: true, town: true } },
  property: { select: { id: true, name: true, city: true } },
  assignee: { select: { id: true, fullName: true } },
} as const;

const DETAIL = {
  ...ROW,
  requestedBy: { select: { id: true, fullName: true, role: true } },
  internalNotes: { orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], include: { author: { select: { fullName: true } } } },
} as const satisfies Prisma.WebsiteAssistanceRequestInclude;

export type AssistanceRow = Prisma.WebsiteAssistanceRequestGetPayload<{ include: typeof ROW }>;
export type AssistanceDetail = Prisma.WebsiteAssistanceRequestGetPayload<{ include: typeof DETAIL }>;

export type NewAssistanceRequest = Omit<Prisma.WebsiteAssistanceRequestUncheckedCreateInput, 'id' | 'status' | 'assigneeId' | 'updatedAt' | 'closedAt'>;

export type AssistanceListFilters = { status?: WebsiteAssistanceStatus; assigneeId?: string | null; q?: string };

const OPEN = { status: { in: [...OPEN_STATUSES] } };

// Prisma access for website assistance requests and their internal notes.
@Injectable()
export class WebsiteAssistanceRepository {
  constructor(private readonly prisma: PrismaService) {}

  findOpenForCompany(companyId: string, db: Db = this.prisma) {
    return db.websiteAssistanceRequest.findFirst({ where: { companyId, ...OPEN }, include: ROW });
  }

  // The property a new request is for: the company's first one.
  firstPropertyId(companyId: string) {
    return this.prisma.property
      .findFirst({ where: { companyId }, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }], select: { id: true } })
      .then((property) => property?.id ?? null);
  }

  create(data: NewAssistanceRequest, db: Db = this.prisma) {
    return db.websiteAssistanceRequest.create({ data, include: ROW });
  }

  findRow(id: string, db: Db = this.prisma) {
    return db.websiteAssistanceRequest.findUniqueOrThrow({ where: { id }, include: ROW });
  }

  // Changes the request only while it is still open; false when it was closed meanwhile.
  async updateIfOpen(id: string, data: Prisma.WebsiteAssistanceRequestUncheckedUpdateManyInput, db: Db = this.prisma) {
    const { count } = await db.websiteAssistanceRequest.updateMany({ where: { id, ...OPEN }, data });
    return count === 1;
  }

  findDetail(id: string, db: Db = this.prisma): Promise<AssistanceDetail | null> {
    return db.websiteAssistanceRequest.findUnique({ where: { id }, include: DETAIL });
  }

  // Open requests, soonest due first (no due date last), then oldest first.
  listOpen({ status, assigneeId, q }: AssistanceListFilters) {
    const where: Prisma.WebsiteAssistanceRequestWhereInput = {
      ...(status ? { status } : OPEN),
      ...(assigneeId !== undefined ? { assigneeId } : {}),
      ...(q
        ? {
            OR: [
              { reference: { contains: q, mode: 'insensitive' } },
              { contactName: { contains: q, mode: 'insensitive' } },
              { company: { name: { contains: q, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };
    return this.prisma.websiteAssistanceRequest.findMany({
      where,
      include: ROW,
      orderBy: [{ dueAt: { sort: 'asc', nulls: 'last' } }, { createdAt: 'asc' }, { id: 'asc' }],
    });
  }

  async openCounts(): Promise<Record<WebsiteAssistanceStatus, number>> {
    const groups = await this.prisma.websiteAssistanceRequest.groupBy({ by: ['status'], where: OPEN, _count: { _all: true } });
    const counts = { REQUESTED: 0, IN_PROGRESS: 0, REVIEW: 0, PUBLISHED: 0, CANCELLED: 0 };
    for (const group of groups) counts[group.status] = group._count._all;
    return counts;
  }

  // Team members holding at least one open request (for the Assignee filter).
  openAssignees() {
    return this.prisma.platformAdmin.findMany({
      where: { websiteRequestsAssigned: { some: OPEN } },
      select: { id: true, fullName: true },
      orderBy: { fullName: 'asc' },
    });
  }

  // Active platform admins a request can be assigned to.
  activeTeam() {
    return this.prisma.platformAdmin.findMany({ where: { status: 'ACTIVE' }, select: { id: true, fullName: true }, orderBy: { fullName: 'asc' } });
  }

  findActiveAdmin(id: string) {
    return this.prisma.platformAdmin.findFirst({ where: { id, status: 'ACTIVE' }, select: { id: true, fullName: true } });
  }

  addNote(requestId: string, authorId: string, text: string, db: Db = this.prisma) {
    return db.websiteAssistanceNote.create({ data: { requestId, authorId, text } });
  }

  // The company's current plan name, for the team's context.
  currentPlanName(companyId: string) {
    return this.prisma.subscription
      .findFirst({ where: { companyId, endedAt: null }, include: { plan: { select: { name: true } } } })
      .then((subscription) => subscription?.plan.name ?? null);
  }

  // Display names for audit actors.
  async actorNames(staffIds: string[], adminIds: string[]) {
    const [staff, admins] = await Promise.all([
      staffIds.length ? this.prisma.staff.findMany({ where: { id: { in: staffIds } }, select: { id: true, fullName: true } }) : [],
      adminIds.length ? this.prisma.platformAdmin.findMany({ where: { id: { in: adminIds } }, select: { id: true, fullName: true } }) : [],
    ]);
    return new Map([...staff, ...admins].map((person) => [person.id, person.fullName]));
  }
}
