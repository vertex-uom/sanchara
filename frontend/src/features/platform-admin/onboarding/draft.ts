import type { CompanyDraft } from "../types";

// The create-company draft: empty values, client-side checks that match the
// API (backend CreateCompanyDto), and the request body. The API checks
// everything again and has the last word (e.g. a subdomain taken meanwhile).

export const SUBDOMAIN_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const E164_PATTERN = /^\+[1-9]\d{7,14}$/;
const POSTAL_CODE_PATTERN = /^\d{5}$/;

export function emptyDraft(planCode: string): CompanyDraft {
  return {
    company: { name: "", subdomain: "", town: "", planCode },
    property: { name: "", typeCode: "", line1: "", line2: "", city: "", districtId: "", postalCode: "" },
    owner: { fullName: "", email: "", phone: "" },
  };
}

export function toSubdomain(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
}

// "+94 77-123 4567" → "+94771234567", as the API stores it.
export function normalisePhone(phone: string) {
  return phone.replace(/[\s()-]/g, "");
}

export type StepKey = "company" | "property" | "owner";

// Wizard field keys. Each belongs to one step.
export type FieldKey =
  | "name"
  | "subdomain"
  | "town"
  | "plan"
  | "propertyName"
  | "type"
  | "line1"
  | "line2"
  | "city"
  | "district"
  | "postalCode"
  | "ownerName"
  | "email"
  | "phone";

export type StepErrors = Partial<Record<FieldKey, string>>;

export const FIELD_STEP: Record<FieldKey, StepKey> = {
  name: "company",
  subdomain: "company",
  town: "company",
  plan: "company",
  propertyName: "property",
  type: "property",
  line1: "property",
  line2: "property",
  city: "property",
  district: "property",
  postalCode: "property",
  ownerName: "owner",
  email: "owner",
  phone: "owner",
};

// API field paths (fieldErrors keys) → wizard fields.
export const API_FIELDS: Record<string, FieldKey> = {
  "company.name": "name",
  "company.subdomain": "subdomain",
  "company.town": "town",
  "company.planCode": "plan",
  "property.name": "propertyName",
  "property.typeCode": "type",
  "property.address.line1": "line1",
  "property.address.line2": "line2",
  "property.address.city": "city",
  "property.address.districtId": "district",
  "property.address.postalCode": "postalCode",
  "owner.fullName": "ownerName",
  "owner.email": "email",
  "owner.phone": "phone",
};

const between = (value: string, min: number, max: number) => value.trim().length >= min && value.trim().length <= max;

export function validateStep(step: StepKey, draft: CompanyDraft, reserved: readonly string[]): StepErrors {
  const errors: StepErrors = {};
  if (step === "company") {
    const { name, subdomain, town, planCode } = draft.company;
    if (!between(name, 2, 120)) errors.name = "Enter the company name (2 to 120 characters).";
    if (!SUBDOMAIN_PATTERN.test(subdomain)) errors.subdomain = "3–40 characters: lowercase letters, digits and hyphens; no hyphen at the ends.";
    else if (reserved.includes(subdomain)) errors.subdomain = "This subdomain is reserved by the platform.";
    if (!between(town, 1, 80)) errors.town = "Enter the town or area.";
    if (!planCode) errors.plan = "Choose a plan.";
  }
  if (step === "property") {
    const { name, typeCode, line1, line2, city, districtId, postalCode } = draft.property;
    if (!between(name, 2, 120)) errors.propertyName = "Enter the property name (2 to 120 characters).";
    if (!typeCode) errors.type = "Pick a property type.";
    if (!between(line1, 1, 160)) errors.line1 = "Enter the street address.";
    if (line2.trim().length > 160) errors.line2 = "Use at most 160 characters.";
    if (!between(city, 1, 80)) errors.city = "Enter the town or city.";
    if (!districtId) errors.district = "Choose a district.";
    if (postalCode.trim() && !POSTAL_CODE_PATTERN.test(postalCode.trim())) errors.postalCode = "Postal codes in Sri Lanka have 5 digits.";
  }
  if (step === "owner") {
    const { fullName, email, phone } = draft.owner;
    if (!between(fullName, 2, 120)) errors.ownerName = "Enter the Owner's name.";
    if (!EMAIL_PATTERN.test(email.trim())) errors.email = "Enter a valid email address.";
    if (!E164_PATTERN.test(normalisePhone(phone))) errors.phone = "Enter the phone number with country code, e.g. +94 77 123 4567.";
  }
  return errors;
}

// Blank optional fields are left out.
export function toRequestBody(draft: CompanyDraft) {
  const { company, property, owner } = draft;
  const optional = (value: string) => (value.trim() ? value.trim() : undefined);
  return {
    company: { name: company.name.trim(), subdomain: company.subdomain, town: company.town.trim(), planCode: company.planCode },
    property: {
      name: property.name.trim(),
      typeCode: property.typeCode,
      address: {
        line1: property.line1.trim(),
        line2: optional(property.line2),
        city: property.city.trim(),
        districtId: Number(property.districtId),
        postalCode: optional(property.postalCode),
      },
    },
    owner: { fullName: owner.fullName.trim(), email: owner.email.trim().toLowerCase(), phone: normalisePhone(owner.phone) },
  };
}
