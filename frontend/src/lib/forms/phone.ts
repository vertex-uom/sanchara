// Phone number checks shared by every form, matching the API's rules. Spaces,
// dashes and brackets are dropped before checking. Forms run these on every
// change, so the error shows while typing; the API still validates again.

// "sri-lanka": a Sri Lankan number, local or with +94 (Owner phone).
// "international": any country, with its + code (guest mobile).
// "any": either of the above (property and contact numbers).
// "national": the 9 digits after a fixed +94 prefix, without the leading 0.
export type PhoneRule = "sri-lanka" | "international" | "any" | "national";

// Sri Lankan numbers in E.164: +94 then 9 digits, not starting with 0.
const LK_E164 = /^\+94[1-9]\d{8}$/;
// Any country in E.164: + then 8 to 15 digits.
export const E164 = /^\+[1-9]\d{7,14}$/;
const NATIONAL = /^[1-9]\d{8}$/;
// What a phone number is typed with.
const PHONE_CHARACTERS = /^\+?[\d\s()-]*$/;

export const PHONE_MESSAGES = {
  characters: "Use digits only, with an optional + at the start.",
  "sri-lanka": "Enter a Sri Lankan number, e.g. 077 123 4567 or +94 77 123 4567.",
  international: "Enter the number with country code, e.g. +94 77 123 4567.",
  any: "Enter a valid phone number, e.g. 077 123 4567 or +94 77 123 4567.",
  national: "Enter 9 digits, e.g. 77 123 4567.",
  leadingZero: "Leave out the leading 0, e.g. 77 123 4567.",
} as const;

export function cleanPhone(phone: string) {
  return phone.trim().replace(/[\s()-]/g, "");
}

// "+94 77-123 4567", "077 123 4567", "94771234567" or "0094771234567" →
// "+94771234567", as the API stores it. Anything else is returned cleaned,
// and then fails the check.
export function normaliseSriLankanPhone(phone: string) {
  const cleaned = cleanPhone(phone);
  if (/^0\d{9}$/.test(cleaned)) return `+94${cleaned.slice(1)}`;
  if (/^94\d{9}$/.test(cleaned)) return `+${cleaned}`;
  if (/^0094\d{9}$/.test(cleaned)) return `+${cleaned.slice(2)}`;
  return cleaned;
}

// The problem with a phone number, or undefined when it is fine. An empty
// value is fine unless `required` (its message) is given.
export function phoneError(phone: string, rule: PhoneRule, required?: string): string | undefined {
  if (!phone.trim()) return required;
  if (!PHONE_CHARACTERS.test(phone.trim())) return PHONE_MESSAGES.characters;
  const cleaned = cleanPhone(phone);
  switch (rule) {
    case "sri-lanka":
      return LK_E164.test(normaliseSriLankanPhone(phone)) ? undefined : PHONE_MESSAGES["sri-lanka"];
    case "international":
      return E164.test(cleaned) ? undefined : PHONE_MESSAGES.international;
    case "any":
      return LK_E164.test(normaliseSriLankanPhone(phone)) || E164.test(cleaned) ? undefined : PHONE_MESSAGES.any;
    case "national":
      if (cleaned.startsWith("0")) return PHONE_MESSAGES.leadingZero;
      return NATIONAL.test(cleaned) ? undefined : PHONE_MESSAGES.national;
  }
}
