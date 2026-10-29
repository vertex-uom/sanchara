import { randomInt } from 'node:crypto';
import type { KebabName } from '../../common/validation/api-names.js';
import type {
  WebsiteAssistanceContact,
  WebsiteAssistanceStatus,
  WebsiteAssistanceStyle,
  WebsiteAssistanceTiming,
} from '../../generated/prisma/client.js';

// What the website should do. The Back Office shows the same keys as chips.
export const GOAL_KEYS = [
  'direct-bookings',
  'rooms-prices',
  'photo-gallery',
  'multi-language',
  'local-experiences',
  'online-payments',
  'guest-reviews',
] as const;

export type AssistanceStatusName = KebabName<WebsiteAssistanceStatus>;
export type AssistanceStyleName = KebabName<WebsiteAssistanceStyle>;
export type AssistanceTimingName = KebabName<WebsiteAssistanceTiming>;
export type AssistanceContactName = KebabName<WebsiteAssistanceContact>;

export const STYLE_NAMES: readonly AssistanceStyleName[] = ['coastal', 'modern', 'luxury', 'cozy'];
export const TIMING_NAMES: readonly AssistanceTimingName[] = ['one-week', 'two-weeks', 'one-month', 'no-rush'];
export const CONTACT_NAMES: readonly AssistanceContactName[] = ['whatsapp', 'phone', 'email'];

// Statuses a request is open in; the team moves it on, publishing closes it.
export const OPEN_STATUSES: readonly WebsiteAssistanceStatus[] = ['REQUESTED', 'IN_PROGRESS', 'REVIEW'];
export const OPEN_STATUS_NAMES: readonly AssistanceStatusName[] = ['requested', 'in-progress', 'review'];
export const ADMIN_STATUS_NAMES: readonly AssistanceStatusName[] = [...OPEN_STATUS_NAMES, 'published'];

export const NOTES_MAX = 600;
export const INTERNAL_NOTE_MAX = 1000;

// The team aims to finish within the timing the company chose.
const TIMING_DAYS: Record<WebsiteAssistanceTiming, number | null> = { ONE_WEEK: 7, TWO_WEEKS: 14, ONE_MONTH: 30, NO_RUSH: null };

export function dueAt(timing: WebsiteAssistanceTiming, requestedAt: Date): Date | null {
  const days = TIMING_DAYS[timing];
  return days === null ? null : new Date(requestedAt.getTime() + days * 24 * 60 * 60 * 1000);
}

// "WMX-20481". Unique in the table; callers retry on a clash.
export function newReference(): string {
  return `WMX-${randomInt(10_000, 100_000)}`;
}
