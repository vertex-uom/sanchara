import type { KebabName } from '../../common/validation/api-names.js';
import type { ContactSubject } from '../../generated/prisma/client.js';

export type ContactSubjectName = KebabName<ContactSubject>;

export const CONTACT_SUBJECT_NAMES: readonly ContactSubjectName[] = ['general-inquiry', 'support', 'sales', 'feedback', 'other'];

export const MESSAGE_MIN = 10;
export const MESSAGE_MAX = 2000;
export const CONTACT_PAGE_SIZE = 20;

const HOUR = 60 * 60;

// Per sender: enough for a real person, little use to a spammer.
export const CONTACT_LIMITS = {
  perIp: { limit: 5, window: HOUR },
  perEmail: { limit: 3, window: HOUR },
} as const;
