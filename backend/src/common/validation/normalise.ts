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

// Sri Lankan numbers in E.164: +94 then 9 digits, not starting with 0
// (mobile 7x, or a landline area code).
export const LK_PHONE_PATTERN = /^\+94[1-9]\d{8}$/;

// Accepts "+94 77 123 4567", "077-123 4567", "94771234567" or "0094771234567";
// returns "+94771234567", or the cleaned string (which then fails validation).
export function normaliseSriLankanPhone(phone: string): string {
  const cleaned = normaliseMobile(phone.trim());
  if (/^0\d{9}$/.test(cleaned)) return `+94${cleaned.slice(1)}`;
  if (/^94\d{9}$/.test(cleaned)) return `+${cleaned}`;
  if (/^0094\d{9}$/.test(cleaned)) return `+${cleaned.slice(2)}`;
  return cleaned;
}
