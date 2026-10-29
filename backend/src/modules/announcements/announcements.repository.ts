import { Injectable } from '@nestjs/common';
import type { Db } from '../../common/prisma/db.js';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import type { AnnouncementAudience, AnnouncementType, Prisma } from '../../generated/prisma/client.js';
import type { AnnouncementStatusName } from './announcements.rules.js';

const WITH_ADMINS = {
  createdBy: { select: { id: true, fullName: true } },
  archivedBy: { select: { id: true, fullName: true } },
} as const;

export type AnnouncementRow = Prisma.AnnouncementGetPayload<{ include: typeof WITH_ADMINS }>;

export type AnnouncementInput = {
  title: string;
  message: string;
  type: AnnouncementType;
  audience: AnnouncementAudience;
  dismissible: boolean;
  startsAt: Date;
  endsAt: Date | null;
};

// The same split as statusOf(), as a query.
function statusWhere(status: AnnouncementStatusName, now: Date): Prisma.AnnouncementWhereInput {
  switch (status) {
    case 'scheduled':
      return { archivedAt: null, startsAt: { gt: now } };
    case 'active':
      return { archivedAt: null, startsAt: { lte: now }, OR: [{ endsAt: null }, { endsAt: { gt: now } }] };
    case 'archived':
      return { OR: [{ archivedAt: { not: null } }, { endsAt: { lte: now } }] };
  }
}

@Injectable()
export class AnnouncementsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.announcement.findUnique({ where: { id }, include: WITH_ADMINS });
  }

  create(data: AnnouncementInput & { createdById: string }, db: Db = this.prisma) {
    return db.announcement.create({ data, select: { id: true } });
  }

  // Only while it hasn't started, been published or archived; false otherwise
  // (e.g. the publisher took it a moment earlier).
  async updateScheduled(id: string, data: AnnouncementInput, now: Date, db: Db = this.prisma) {
    const { count } = await db.announcement.updateMany({ where: { id, publishedAt: null, archivedAt: null, startsAt: { gt: now } }, data });
    return count === 1;
  }

  // False when it was archived already.
  async archive(id: string, archivedById: string, now: Date, db: Db = this.prisma) {
    const { count } = await db.announcement.updateMany({ where: { id, archivedAt: null }, data: { archivedAt: now, archivedById } });
    return count === 1;
  }

  count(status: AnnouncementStatusName, now: Date) {
    return this.prisma.announcement.count({ where: statusWhere(status, now) });
  }

  // Active: newest start first. Scheduled: soonest first. Archived: most
  // recently ended (or archived) first.
  async list(status: AnnouncementStatusName, now: Date, skip: number, take: number): Promise<AnnouncementRow[]> {
    if (status !== 'archived') {
      const direction = status === 'scheduled' ? 'asc' : 'desc';
      return this.prisma.announcement.findMany({
        where: statusWhere(status, now),
        orderBy: [{ startsAt: direction }, { id: direction }],
        skip,
        take,
        include: WITH_ADMINS,
      });
    }
    const ids = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM announcements
      WHERE archived_at IS NOT NULL OR ends_at <= ${now}
      ORDER BY COALESCE(archived_at, ends_at) DESC, id DESC
      OFFSET ${skip} LIMIT ${take}`;
    const rows = await this.prisma.announcement.findMany({ where: { id: { in: ids.map((row) => row.id) } }, include: WITH_ADMINS });
    const byId = new Map(rows.map((row) => [row.id, row]));
    return ids.flatMap(({ id }) => byId.get(id) ?? []);
  }

  // Published and not yet withdrawn: what staff should currently see.
  live() {
    return this.prisma.announcement.findMany({ where: { publishedAt: { not: null }, withdrawnAt: null }, orderBy: [{ startsAt: 'asc' }, { id: 'asc' }] });
  }

  // --- Publisher queues -------------------------------------------------------

  // Started, not ended, not archived, not published yet.
  dueToPublish(now: Date, take: number) {
    return this.prisma.announcement.findMany({
      where: { publishedAt: null, archivedAt: null, startsAt: { lte: now }, OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
      orderBy: [{ startsAt: 'asc' }, { id: 'asc' }],
      take,
    });
  }

  // Published and not withdrawn, but archived or past its end.
  dueToWithdraw(now: Date, take: number) {
    return this.prisma.announcement.findMany({
      where: { publishedAt: { not: null }, withdrawnAt: null, OR: [{ archivedAt: { not: null } }, { endsAt: { lte: now } }] },
      orderBy: [{ startsAt: 'asc' }, { id: 'asc' }],
      take,
    });
  }

  // Claims are conditional updates: with several API instances only one wins,
  // and only the winner raises the event.
  async claimPublish(id: string, at: Date) {
    const { count } = await this.prisma.announcement.updateMany({ where: { id, publishedAt: null, archivedAt: null }, data: { publishedAt: at } });
    return count === 1;
  }

  // Undoes a claim whose event failed, so the next pass retries it.
  async releasePublish(id: string, at: Date) {
    await this.prisma.announcement.updateMany({ where: { id, publishedAt: at, withdrawnAt: null }, data: { publishedAt: null } });
  }

  async claimWithdraw(id: string, at: Date) {
    const { count } = await this.prisma.announcement.updateMany({ where: { id, publishedAt: { not: null }, withdrawnAt: null }, data: { withdrawnAt: at } });
    return count === 1;
  }

  async releaseWithdraw(id: string, at: Date) {
    await this.prisma.announcement.updateMany({ where: { id, withdrawnAt: at }, data: { withdrawnAt: null } });
  }
}
