import { HttpStatus, Injectable } from '@nestjs/common';
import { AppException } from '../../common/errors/app-exception.js';
import type { AnnouncementPublished } from '../announcements/announcement.events.js';
import { STATUSES_BY_NAME } from '../companies/companies.service.js';
import { ROLES_BY_NAME, type SignedInStaff } from '../staff/staff.service.js';
import { NotificationsRepository, type NotificationData, type Viewer } from './notifications.repository.js';
import { ANNOUNCEMENT_SEVERITY, FEED_LIMIT, READ_ALL_LIMIT, SEVERITY_NAMES, SOURCES, type NotificationCategory } from './notifications.rules.js';

const notFound = () => new AppException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'That notification does not exist.');
const notDismissible = () => new AppException(HttpStatus.CONFLICT, 'NOT_DISMISSIBLE', 'This notification stays until it ends and cannot be dismissed.');

function viewerOf(staff: SignedInStaff): Viewer {
  return { staffId: staff.id, role: ROLES_BY_NAME[staff.role], companyId: staff.company.id, companyStatus: STATUSES_BY_NAME[staff.company.status] };
}

function announcementData(event: AnnouncementPublished): NotificationData {
  return {
    sourceType: SOURCES.announcement,
    sourceId: event.announcementId,
    category: 'system' satisfies NotificationCategory,
    severity: ANNOUNCEMENT_SEVERITY[event.type],
    title: event.title,
    message: event.message,
    actionLabel: null,
    actionHref: null,
    roles: event.recipients.roles,
    companyStatuses: event.recipients.companyStatuses,
    companyId: null,
    dismissible: event.dismissible,
    startsAt: new Date(event.startsAt),
    endsAt: event.endsAt ? new Date(event.endsAt) : null,
  };
}

// System notifications for company staff (Back Office bell). Never email or
// WhatsApp. Sources raise them (today: announcements, through events); each
// staff member sees the live ones addressed to their role and company.
@Injectable()
export class NotificationsService {
  constructor(private readonly repository: NotificationsRepository) {}

  // Newest first, with this staff member's read state and unread total.
  async feed(staff: SignedInStaff, now = new Date()) {
    const viewer = viewerOf(staff);
    const [rows, unreadCount] = await Promise.all([this.repository.feed(viewer, now, FEED_LIMIT), this.repository.unreadCount(viewer, now)]);
    return {
      items: rows.map((row) => ({
        id: row.id,
        type: row.category as NotificationCategory,
        severity: SEVERITY_NAMES[row.severity],
        dashboard: 'backoffice' as const,
        title: row.title,
        message: row.message,
        createdAt: row.startsAt.toISOString(),
        read: Boolean(row.receipts[0]?.readAt),
        dismissible: row.dismissible,
        ...(row.actionLabel && row.actionHref ? { actionLabel: row.actionLabel, href: row.actionHref } : {}),
      })),
      unreadCount,
    };
  }

  async markRead(staff: SignedInStaff, id: string, now = new Date()) {
    const viewer = viewerOf(staff);
    if (!(await this.repository.findVisible(viewer, id, now))) throw notFound();
    await this.repository.markRead(viewer.staffId, [id], now);
  }

  async markAllRead(staff: SignedInStaff, now = new Date()) {
    const viewer = viewerOf(staff);
    const unread = await this.repository.unreadIds(viewer, now, READ_ALL_LIMIT);
    await this.repository.markRead(viewer.staffId, unread.map((row) => row.id), now);
  }

  async dismiss(staff: SignedInStaff, id: string, now = new Date()) {
    const viewer = viewerOf(staff);
    const notification = await this.repository.findVisible(viewer, id, now);
    if (!notification) throw notFound();
    if (!notification.dismissible) throw notDismissible();
    await this.repository.markDismissed(viewer.staffId, id, now);
  }

  // --- Announcements (idempotent: the same event may arrive more than once) ---

  async showAnnouncement(event: AnnouncementPublished) {
    await this.repository.upsertFromSource(announcementData(event));
  }

  async withdrawAnnouncement(announcementId: string, at: Date) {
    await this.repository.withdrawSource(SOURCES.announcement, announcementId, at);
  }

  // Brings notifications in line with the announcements live right now, e.g.
  // after a restart during which events were missed.
  async reconcileAnnouncements(live: AnnouncementPublished[], now = new Date()) {
    for (const event of live) await this.showAnnouncement(event);
    await this.repository.withdrawStale(SOURCES.announcement, live.map((event) => event.announcementId), now);
  }
}
