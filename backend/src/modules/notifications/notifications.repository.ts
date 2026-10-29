import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import type { CompanyStatus, Prisma, StaffRole } from '../../generated/prisma/client.js';

// The signed-in staff member a feed is for.
export type Viewer = { staffId: string; role: StaffRole; companyId: string; companyStatus: CompanyStatus };

export type NotificationData = Omit<Prisma.NotificationUncheckedCreateInput, 'id' | 'createdAt' | 'updatedAt' | 'withdrawnAt'>;

// Live (started, not ended, not withdrawn), addressed to the viewer's role,
// company status and company, and not dismissed by them.
function visibleTo(viewer: Viewer, now: Date): Prisma.NotificationWhereInput {
  return {
    withdrawnAt: null,
    startsAt: { lte: now },
    roles: { has: viewer.role },
    companyStatuses: { has: viewer.companyStatus },
    AND: [{ OR: [{ endsAt: null }, { endsAt: { gt: now } }] }, { OR: [{ companyId: null }, { companyId: viewer.companyId }] }],
    receipts: { none: { staffId: viewer.staffId, dismissedAt: { not: null } } },
  };
}

const unreadBy = (viewer: Viewer): Prisma.NotificationWhereInput => ({ receipts: { none: { staffId: viewer.staffId, readAt: { not: null } } } });

@Injectable()
export class NotificationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  // --- Staff feed ---------------------------------------------------------------

  feed(viewer: Viewer, now: Date, take: number) {
    return this.prisma.notification.findMany({
      where: visibleTo(viewer, now),
      orderBy: [{ startsAt: 'desc' }, { id: 'desc' }],
      take,
      include: { receipts: { where: { staffId: viewer.staffId }, select: { readAt: true } } },
    });
  }

  unreadCount(viewer: Viewer, now: Date) {
    return this.prisma.notification.count({ where: { AND: [visibleTo(viewer, now), unreadBy(viewer)] } });
  }

  findVisible(viewer: Viewer, id: string, now: Date) {
    return this.prisma.notification.findFirst({ where: { AND: [{ id }, visibleTo(viewer, now)] }, select: { id: true, dismissible: true } });
  }

  unreadIds(viewer: Viewer, now: Date, take: number) {
    return this.prisma.notification.findMany({ where: { AND: [visibleTo(viewer, now), unreadBy(viewer)] }, select: { id: true }, take });
  }

  // Sets read_at (keeping an earlier one) for these notifications.
  async markRead(staffId: string, notificationIds: string[], at: Date) {
    if (notificationIds.length === 0) return;
    await this.prisma.$transaction([
      this.prisma.notificationReceipt.createMany({ data: notificationIds.map((notificationId) => ({ notificationId, staffId, readAt: at })), skipDuplicates: true }),
      this.prisma.notificationReceipt.updateMany({ where: { staffId, notificationId: { in: notificationIds }, readAt: null }, data: { readAt: at } }),
    ]);
  }

  // Dismissing also counts as reading.
  async markDismissed(staffId: string, notificationId: string, at: Date) {
    await this.prisma.$transaction([
      this.prisma.notificationReceipt.createMany({ data: [{ notificationId, staffId, readAt: at, dismissedAt: at }], skipDuplicates: true }),
      this.prisma.notificationReceipt.updateMany({ where: { staffId, notificationId, readAt: null }, data: { readAt: at } }),
      this.prisma.notificationReceipt.updateMany({ where: { staffId, notificationId, dismissedAt: null }, data: { dismissedAt: at } }),
    ]);
  }

  // --- Sources ------------------------------------------------------------------

  // Creates or refreshes the notification for a source. A withdrawn one stays withdrawn.
  upsertFromSource(data: NotificationData) {
    const { sourceType, sourceId, ...fields } = data;
    return this.prisma.notification.upsert({
      where: { sourceType_sourceId: { sourceType, sourceId } },
      create: data,
      update: fields,
      select: { id: true },
    });
  }

  withdrawSource(sourceType: string, sourceId: string, at: Date) {
    return this.prisma.notification.updateMany({ where: { sourceType, sourceId, withdrawnAt: null }, data: { withdrawnAt: at } });
  }

  // Withdraws every live notification of this source type whose source is no
  // longer live, leaving rows refreshed since `before` (a parallel event) alone.
  withdrawStale(sourceType: string, liveSourceIds: string[], before: Date) {
    return this.prisma.notification.updateMany({
      where: { sourceType, withdrawnAt: null, sourceId: { notIn: liveSourceIds }, updatedAt: { lt: before } },
      data: { withdrawnAt: before },
    });
  }
}
