// Emails are compared and stored trimmed + lowercased (matches the DB CHECK).
export function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

// Accepts "+94 77-123 4567" style input; returns E.164 or the cleaned string
// (which then fails validation) so the user sees their own mistake.
export function normaliseMobile(mobile: string): string {
  return mobile.replace(/[\s()-]/g, '');
}

export const E164_PATTERN = /^\+[1-9]\d{7,14}$/;
