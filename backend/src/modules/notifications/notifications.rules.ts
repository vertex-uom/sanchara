import type { NotificationSeverity } from '../../generated/prisma/client.js';
import type { AnnouncementTypeName } from '../announcements/announcements.rules.js';

// Newest notifications returned to the bell.
export const FEED_LIMIT = 30;
// Most notifications marked read by one "mark all as read".
export const READ_ALL_LIMIT = 500;

// What raised a notification (notifications.source_type).
export const SOURCES = { announcement: 'announcement' } as const;

// Category the Back Office bell shows an icon for (its NotificationType).
export type NotificationCategory = 'booking' | 'payment' | 'hold' | 'no_show' | 'review' | 'subscription' | 'company' | 'website' | 'system';

export const SEVERITY_NAMES = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  CRITICAL: 'critical',
} as const satisfies Record<NotificationSeverity, string>;

// Same tones as the Platform Admin console shows for each announcement type.
export const ANNOUNCEMENT_SEVERITY: Record<AnnouncementTypeName, NotificationSeverity> = {
  feature: 'SUCCESS',
  maintenance: 'INFO',
  policy: 'INFO',
  reminder: 'WARNING',
  urgent: 'CRITICAL',
};
