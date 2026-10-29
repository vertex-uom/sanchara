import type { CompanyStatus, StaffRole, StaffStatus } from '../../generated/prisma/client.js';
import type { AnnouncementAudienceName, AnnouncementTypeName } from './announcements.rules.js';

// Raised once when an announcement goes live: at its start time, or at once
// when it is published "now". The notifications module shows it to every
// matching staff member as a system notification until it is withdrawn.
export type AnnouncementPublished = {
  announcementId: string;
  // Plain text: render as text, never as HTML.
  title: string;
  message: string;
  type: AnnouncementTypeName;
  audience: AnnouncementAudienceName;
  // Who receives it: staff with one of these roles and statuses, in companies
  // with one of these statuses.
  recipients: { roles: StaffRole[]; staffStatuses: StaffStatus[]; companyStatuses: CompanyStatus[] };
  // Staff may dismiss the notification.
  dismissible: boolean;
  startsAt: string;
  // Null: until archived.
  endsAt: string | null;
  publishedAt: string;
};

// Raised once when a live announcement stops: an admin archived it, or its end
// time passed. The notification must disappear for everyone.
export type AnnouncementWithdrawn = {
  announcementId: string;
  reason: 'archived' | 'ended';
  withdrawnAt: string;
};

declare module '../../common/events/domain-events.js' {
  interface DomainEventMap {
    'announcement.published': AnnouncementPublished;
    'announcement.withdrawn': AnnouncementWithdrawn;
  }
}
