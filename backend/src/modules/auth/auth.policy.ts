// Agreed auth rules in one place. Times in seconds unless the name says ms.

export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;

const HOUR = 60 * 60;
const DAY = 24 * HOUR;

// Sliding idle TTLs, capped by an absolute lifetime.
export const SESSION_TTL = { normal: DAY, remember: 30 * DAY, absolute: 90 * DAY };

export const RESET_TOKEN_TTL = 30 * 60;
export const OAUTH_STATE_TTL = 10 * 60;

export const LIMITS = {
  // 5 failed logins per email in 15 min locks that email for 15 min.
  loginFailuresPerEmail: { limit: 5, window: 15 * 60, lock: 15 * 60 },
  loginPerIp: { limit: 30, window: 15 * 60 },
  registerPerIp: { limit: 5, window: HOUR },
  forgotPerEmail: { limit: 3, window: HOUR },
  forgotPerIp: { limit: 10, window: HOUR },
} as const;

// Web app page that handles the reset link (frontend route).
export const RESET_PASSWORD_PATH = '/reset-password';
