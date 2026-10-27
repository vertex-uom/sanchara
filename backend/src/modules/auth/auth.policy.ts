// Agreed auth rules in one place. Times in seconds unless the name says ms.

export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;

// Session TTLs per audience live with the session store (common/security).

const HOUR = 60 * 60;

export const RESET_TOKEN_TTL = 30 * 60;
export const OAUTH_STATE_TTL = 10 * 60;

// Guest and staff use the same numbers under separate keys.
export const LIMITS = {
  // 5 failed logins per email in 15 min locks that email for 15 min.
  loginFailuresPerEmail: { limit: 5, window: 15 * 60, lock: 15 * 60 },
  loginPerIp: { limit: 30, window: 15 * 60 },
  registerPerIp: { limit: 5, window: HOUR },
  forgotPerEmail: { limit: 3, window: HOUR },
  forgotPerIp: { limit: 10, window: HOUR },
} as const;

// Page that handles the reset link, on the web app (guests) or the Back Office host (staff).
export const RESET_PASSWORD_PATH = '/reset-password';
