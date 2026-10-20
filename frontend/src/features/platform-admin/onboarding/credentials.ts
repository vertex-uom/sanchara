import { OWNER_CREDENTIALS_VALID_HOURS, type CompanyDraft, type OwnerCredentials } from "../types";

// Browser-side helpers for the create-company flow. TEMPORARY: the API will
// create the company and return the Owner's credentials; until then they are
// generated here so the flow can be used end to end. Nothing is stored.

export const SUBDOMAIN_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const EMPTY_DRAFT: CompanyDraft = {
  company: { name: "", subdomain: "", location: "", plan: "Standard" },
  property: { name: "", type: "", address: "" },
  owner: { name: "", email: "", phone: "" },
};

export function toSubdomain(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
}

export type StepKey = "company" | "property" | "owner";
export type StepErrors = Partial<Record<string, string>>;

export function validateStep(step: StepKey, draft: CompanyDraft, reserved: readonly string[]): StepErrors {
  const errors: StepErrors = {};
  if (step === "company") {
    if (draft.company.name.trim().length < 2) errors.name = "Enter the company name.";
    if (!SUBDOMAIN_PATTERN.test(draft.company.subdomain)) errors.subdomain = "3–40 characters: lowercase letters, digits and hyphens; no hyphen at the ends.";
    else if (reserved.includes(draft.company.subdomain)) errors.subdomain = "This subdomain is reserved by the platform.";
    if (!draft.company.location.trim()) errors.location = "Enter the town or area.";
  }
  if (step === "property") {
    if (draft.property.name.trim().length < 2) errors.propertyName = "Enter the property name.";
    if (!draft.property.type) errors.type = "Pick a property type.";
    if (!draft.property.address.trim()) errors.address = "Enter the address.";
  }
  if (step === "owner") {
    if (draft.owner.name.trim().length < 2) errors.ownerName = "Enter the Owner's name.";
    if (!EMAIL_PATTERN.test(draft.owner.email.trim())) errors.email = "Enter a valid email address; the sign-in details go there.";
    if (!draft.owner.phone.trim()) errors.phone = "Enter a phone number.";
  }
  return errors;
}

// Unambiguous characters only (no 0/O, 1/l/I); at least one of each class.
const LOWER = "abcdefghjkmnpqrstuvwxyz";
const UPPER = "ABCDEFGHJKMNPQRSTUVWXYZ";
const DIGITS = "23456789";
const SYMBOLS = "!#$%&*+-=?@";
const ALL = LOWER + UPPER + DIGITS + SYMBOLS;

function randomFrom(alphabet: string, length: number) {
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

export function generateTemporaryPassword(length = 16) {
  const required = [randomFrom(LOWER, 1), randomFrom(UPPER, 1), randomFrom(DIGITS, 1), randomFrom(SYMBOLS, 1)];
  const chars = [...required, ...randomFrom(ALL, length - required.length)];
  // Fisher–Yates with crypto randomness so the required classes are not always first.
  const order = new Uint32Array(chars.length);
  crypto.getRandomValues(order);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = order[i] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

export function generateInviteToken() {
  return randomFrom("abcdefghijklmnopqrstuvwxyz234567", 26);
}

// The Owner portal is a separate sign-in from the staff one and its link is
// only ever sent to the Owner.
export function ownerPortalLink(backOfficeHost: string, token: string) {
  return `https://${backOfficeHost}/owner/sign-in?invite=${token}`;
}

export function issueCredentials(draft: CompanyDraft, backOfficeHost: string, now: Date): OwnerCredentials {
  const issuedAt = now.toISOString();
  const expiresAt = new Date(now.getTime() + OWNER_CREDENTIALS_VALID_HOURS * 60 * 60 * 1000).toISOString();
  return {
    companyId: `cmp_new_${draft.company.subdomain}`,
    companyName: draft.company.name.trim(),
    subdomain: draft.company.subdomain,
    ownerName: draft.owner.name.trim(),
    ownerEmail: draft.owner.email.trim().toLowerCase(),
    temporaryPassword: generateTemporaryPassword(),
    ownerPortalLink: ownerPortalLink(backOfficeHost, generateInviteToken()),
    issuedAt,
    expiresAt,
  };
}

const CSV_COLUMNS = ["Company", "Subdomain", "Owner name", "Owner email", "Temporary password", "Owner portal link", "Expires"] as const;

const csvCell = (value: string) => `"${value.replace(/"/g, '""')}"`;

export function credentialsCsv(c: OwnerCredentials) {
  const row = [c.companyName, c.subdomain, c.ownerName, c.ownerEmail, c.temporaryPassword, c.ownerPortalLink, c.expiresAt];
  return `${CSV_COLUMNS.join(",")}\r\n${row.map(csvCell).join(",")}\r\n`;
}

export function credentialsCsvFilename(c: OwnerCredentials) {
  return `sanchara-owner-credentials-${c.subdomain}.csv`;
}
