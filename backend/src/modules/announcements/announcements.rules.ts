import type { AnnouncementAudience, AnnouncementType, CompanyStatus, StaffRole, StaffStatus } from '../../generated/prisma/client.js';

export const ANNOUNCEMENT_PAGE_SIZE = 8;
export const TITLE_MAX = 80;
export const MESSAGE_MAX = 400;
// A start up to this far in the past (clock skew, a slow form) counts as "now".
export const START_GRACE_MS = 5 * 60 * 1000;
// Announcements can be scheduled up to a year ahead.
export const MAX_LEAD_MS = 365 * 24 * 60 * 60 * 1000;
// How often the publisher looks for announcements that started, ended or were archived.
export const PUBLISH_INTERVAL_MS = 60 * 1000;
// Announcements handled per queue per pass; the rest wait for the next pass.
export const PUBLISH_BATCH = 50;

// API names (kebab-case, like the rest of the API) ↔ database enums.
export const TYPE_NAMES = {
  FEATURE: 'feature',
  MAINTENANCE: 'maintenance',
  POLICY: 'policy',
  REMINDER: 'reminder',
  URGENT: 'urgent',
} as const satisfies Record<AnnouncementType, string>;

export const AUDIENCE_NAMES = {
  ALL_STAFF: 'all-staff',
  OWNERS: 'owners',
  MANAGERS: 'managers',
  FRONT_DESK: 'front-desk',
} as const satisfies Record<AnnouncementAudience, string>;

export type AnnouncementTypeName = (typeof TYPE_NAMES)[AnnouncementType];
export type AnnouncementAudienceName = (typeof AUDIENCE_NAMES)[AnnouncementAudience];

const invert = <K extends string, V extends string>(map: Record<K, V>) => Object.fromEntries(Object.entries(map).map(([k, v]) => [v, k])) as Record<V, K>;
export const TYPES_BY_NAME = invert(TYPE_NAMES);
export const AUDIENCES_BY_NAME = invert(AUDIENCE_NAMES);
export const TYPE_NAME_LIST = Object.values(TYPE_NAMES);
export const AUDIENCE_NAME_LIST = Object.values(AUDIENCE_NAMES);

// Who receives an announcement: active staff with one of the audience's roles,
// in companies that are active or suspended (suspended Owners still need
// maintenance and billing notices). Companies still in setup are left out.
export const AUDIENCE_ROLES: Record<AnnouncementAudience, StaffRole[]> = {
  ALL_STAFF: ['OWNER', 'MANAGER', 'FRONT_DESK'],
  OWNERS: ['OWNER'],
  MANAGERS: ['MANAGER'],
  FRONT_DESK: ['FRONT_DESK'],
};
export const RECIPIENT_COMPANY_STATUSES: CompanyStatus[] = ['ACTIVE', 'SUSPENDED_NON_PAYMENT', 'SUSPENDED_BY_ADMIN'];
export const RECIPIENT_STAFF_STATUSES: StaffStatus[] = ['ACTIVE'];

export type AnnouncementStatusName = 'scheduled' | 'active' | 'archived';
export const STATUS_NAME_LIST: AnnouncementStatusName[] = ['active', 'scheduled', 'archived'];

// Status comes from the times, never from a stored column, so it can't drift.
export function statusOf(announcement: { startsAt: Date; endsAt: Date | null; archivedAt: Date | null }, now: Date): AnnouncementStatusName {
  if (announcement.archivedAt || (announcement.endsAt && announcement.endsAt <= now)) return 'archived';
  return announcement.startsAt > now ? 'scheduled' : 'active';
}
