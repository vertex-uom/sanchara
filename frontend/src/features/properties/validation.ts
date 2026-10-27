import {
  ADVANCED_LIMITS,
  AMENITY_KEYS,
  BASIC_LIMITS,
  CANCELLATION_META,
  IMAGE_RULES,
  LOGO_RULES,
  POLICY_LIMITS,
  PROPERTY_CATEGORY_LABELS,
  PROPERTY_TYPE_LABELS,
  SMOKING_LABELS,
  SRI_LANKA_DISTRICTS,
} from "./config";
import type {
  CancellationPolicy,
  PropertyAdvanced,
  PropertyBasicInfo,
  PropertyCategory,
  PropertyContact,
  PropertyIntegrations,
  PropertyPolicies,
  PropertyType,
  SettingsSection,
  SmokingPolicy,
} from "./types";

// Form values as text, keyed by field name; "" means "not set" for optional
// fields. Checkbox groups are comma-joined ("wifi,pool"); image captions are
// keyed "caption:<imageId>".
export type FormValues = Record<string, string>;

type Result<T> = { ok: true; value: T } | { ok: false; fieldErrors: Record<string, string> };

// What each tab saves. Images saves only the captions (uploads save at once).
export type SectionValue = {
  basic: PropertyBasicInfo;
  contact: PropertyContact;
  policies: PropertyPolicies;
  amenities: string[];
  images: Record<string, string>;
  integrations: PropertyIntegrations;
  advanced: PropertyAdvanced;
};

const PHONE = /^\+?[\d\s()-]{7,20}$/;
const EMAIL = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

const isType = (value: string): value is PropertyType => Object.hasOwn(PROPERTY_TYPE_LABELS, value);
const isCategory = (value: string): value is PropertyCategory => Object.hasOwn(PROPERTY_CATEGORY_LABELS, value);
const isCancellation = (value: string): value is CancellationPolicy => Object.hasOwn(CANCELLATION_META, value);
const isSmoking = (value: string): value is SmokingPolicy => Object.hasOwn(SMOKING_LABELS, value);

// Collects field errors while reading trimmed values.
function checker(input: FormValues) {
  const errors: Record<string, string> = {};
  const get = (key: string) => (input[key] ?? "").trim();
  return {
    errors,
    get,
    optional: (key: string) => get(key) || null,
    text(key: string, max: number, required: string | null) {
      const value = get(key);
      if (!value && required) errors[key] = required;
      else if (value.length > max) errors[key] = `Use ${max} characters or fewer.`;
      return value;
    },
    match(key: string, pattern: RegExp, message: string) {
      const value = get(key);
      if (value && !pattern.test(value)) errors[key] = message;
      return value || null;
    },
    url(key: string) {
      const value = get(key);
      if (!value) return null;
      try {
        if (new URL(value).protocol === "https:" && value.length <= 500) return value;
      } catch {
        // Falls through to the error.
      }
      errors[key] = "Enter a full link starting with https://";
      return null;
    },
    whole(key: string, min: number, max: number, message: string) {
      const value = get(key);
      const number = /^\d{1,6}$/.test(value) ? Number(value) : NaN;
      if (!(number >= min && number <= max)) errors[key] = message;
      return number;
    },
  };
}

const done = <T,>(errors: Record<string, string>, value: () => T): Result<T> =>
  Object.keys(errors).length > 0 ? { ok: false, fieldErrors: errors } : { ok: true, value: value() };

export function validateBasicInfo(input: FormValues, currentYear: number): Result<PropertyBasicInfo> {
  const c = checker(input);
  const name = c.text("name", BASIC_LIMITS.name, "Enter the property name.");
  const description = c.text("description", BASIC_LIMITS.description, "Enter a short description.");
  const type = c.get("type");
  const stars = c.get("starRating");
  const year = c.get("establishedYear");
  const category = c.get("category");

  if (!isType(type)) c.errors.type = "Choose a property type.";
  if (stars && !/^[1-5]$/.test(stars)) c.errors.starRating = "Choose a star rating.";
  if (year && (!/^\d{4}$/.test(year) || Number(year) < BASIC_LIMITS.minYear || Number(year) > currentYear)) {
    c.errors.establishedYear = `Enter a year from ${BASIC_LIMITS.minYear} to ${currentYear}.`;
  }
  if (category && !isCategory(category)) c.errors.category = "Choose a category.";

  return done(c.errors, () => ({
    name,
    type: type as PropertyType,
    description,
    starRating: stars ? Number(stars) : null,
    establishedYear: year ? Number(year) : null,
    category: category ? (category as PropertyCategory) : null,
  }));
}

export function validateContact(input: FormValues): Result<PropertyContact> {
  const c = checker(input);
  const phone = c.get("phone");
  if (!PHONE.test(phone)) c.errors.phone = "Enter a phone number, like +94 77 123 4567.";
  const email = c.get("email");
  if (!EMAIL.test(email) || email.length > 254) c.errors.email = "Enter a valid email address, like name@example.com.";
  const whatsapp = c.match("whatsapp", PHONE, "Enter a WhatsApp number, like +94 77 123 4567.");
  const website = c.url("website");
  const addressLine1 = c.text("addressLine1", 120, "Enter the street address.");
  const addressLine2 = c.text("addressLine2", 120, null) || null;
  const town = c.text("town", 60, "Enter the town or city.");
  const district = c.get("district");
  if (district && !(SRI_LANKA_DISTRICTS as readonly string[]).includes(district)) c.errors.district = "Choose a district.";
  const postalCode = c.match("postalCode", /^\d{5}$/, "Enter a 5-digit postal code.");
  const country = c.text("country", 60, "Enter the country.");
  const mapUrl = c.url("mapUrl");

  return done(c.errors, () => ({
    phone,
    email,
    whatsapp,
    website,
    addressLine1,
    addressLine2,
    town,
    district: district || null,
    postalCode,
    country,
    mapUrl,
  }));
}

export function validatePolicies(input: FormValues): Result<PropertyPolicies> {
  const c = checker(input);
  const checkInFrom = c.get("checkInFrom");
  if (!TIME.test(checkInFrom)) c.errors.checkInFrom = "Enter the check-in time.";
  const checkInUntil = c.match("checkInUntil", TIME, "Enter a time, or leave it empty.");
  const checkOutBy = c.get("checkOutBy");
  if (!TIME.test(checkOutBy)) c.errors.checkOutBy = "Enter the check-out time.";
  const cancellation = c.get("cancellation");
  if (!isCancellation(cancellation)) c.errors.cancellation = "Choose a cancellation policy.";
  const children = c.get("childrenAllowed");
  if (children !== "yes" && children !== "no") c.errors.childrenAllowed = "Choose yes or no.";
  const pets = c.get("petsAllowed");
  if (pets !== "yes" && pets !== "no") c.errors.petsAllowed = "Choose yes or no.";
  const smoking = c.get("smoking");
  if (!isSmoking(smoking)) c.errors.smoking = "Choose a smoking policy.";
  const houseRules = c.text("houseRules", POLICY_LIMITS.houseRules, null);

  return done(c.errors, () => ({
    checkInFrom,
    checkInUntil,
    checkOutBy,
    cancellation: cancellation as CancellationPolicy,
    childrenAllowed: children === "yes",
    petsAllowed: pets === "yes",
    smoking: smoking as SmokingPolicy,
    houseRules,
  }));
}

// Unknown keys are dropped rather than refused.
export function validateAmenities(input: FormValues): Result<string[]> {
  const chosen = new Set((input.amenities ?? "").split(",").filter(Boolean));
  return { ok: true, value: AMENITY_KEYS.filter((key) => chosen.has(key)) };
}

export function validateCaptions(input: FormValues): Result<Record<string, string>> {
  const c = checker(input);
  const captions: Record<string, string> = {};
  for (const key of Object.keys(input)) {
    if (key.startsWith("caption:")) captions[key.slice("caption:".length)] = c.text(key, IMAGE_RULES.caption, null);
  }
  return done(c.errors, () => captions);
}

export function validateIntegrations(input: FormValues): Result<PropertyIntegrations> {
  const c = checker(input);
  const integrations: PropertyIntegrations = {
    googleAnalyticsId: c.match("googleAnalyticsId", /^G-[A-Z0-9]{4,12}$/, "Enter the measurement ID, like G-AB12CD34EF."),
    metaPixelId: c.match("metaPixelId", /^\d{10,20}$/, "Enter the Pixel ID (numbers only)."),
    googleBusinessUrl: c.url("googleBusinessUrl"),
    tripAdvisorUrl: c.url("tripAdvisorUrl"),
    bookingComIcalUrl: c.url("bookingComIcalUrl"),
    airbnbIcalUrl: c.url("airbnbIcalUrl"),
  };
  return done(c.errors, () => integrations);
}

export function validateAdvanced(input: FormValues): Result<PropertyAdvanced> {
  const c = checker(input);
  const sltdaNumber = c.match("sltdaNumber", /^[A-Za-z0-9/-]{3,30}$/, "Use letters, numbers, / and - only.");
  const vatNumber = c.match("vatNumber", /^\d{9}-?\d{4}$/, "Enter the VAT number, like 123456789-7000.");
  const invoicePrefix = c.get("invoicePrefix").toUpperCase();
  if (!/^[A-Z0-9]{2,6}$/.test(invoicePrefix)) c.errors.invoicePrefix = "Use 2 to 6 letters or numbers.";
  const { bookingWindowDays: window, minNoticeHours: notice } = ADVANCED_LIMITS;
  const bookingWindowDays = c.whole("bookingWindowDays", window.min, window.max, `Enter ${window.min} to ${window.max} days.`);
  const minNoticeHours = c.whole("minNoticeHours", notice.min, notice.max, `Enter ${notice.min} to ${notice.max} hours.`);

  return done(c.errors, () => ({ sltdaNumber, vatNumber, invoicePrefix, bookingWindowDays, minNoticeHours }));
}

// The one entry point the Server Action uses.
export function validateSection<S extends SettingsSection>(
  section: S,
  input: FormValues,
  currentYear: number,
): Result<SectionValue[S]> {
  const validators: { [K in SettingsSection]: () => Result<SectionValue[K]> } = {
    basic: () => validateBasicInfo(input, currentYear),
    contact: () => validateContact(input),
    policies: () => validatePolicies(input),
    amenities: () => validateAmenities(input),
    images: () => validateCaptions(input),
    integrations: () => validateIntegrations(input),
    advanced: () => validateAdvanced(input),
  };
  return validators[section]() as Result<SectionValue[S]>;
}

// Size and type only; the recommended dimensions are advice, not a rule.
export function logoError(file: { size: number; type: string }) {
  if (!(LOGO_RULES.types as readonly string[]).includes(file.type)) return "Choose a JPG or PNG image.";
  if (file.size > LOGO_RULES.maxBytes) return "Choose an image of 2MB or less.";
  return null;
}

export function imageError(file: { size: number; type: string }) {
  if (!(IMAGE_RULES.types as readonly string[]).includes(file.type)) return "Choose a JPG, PNG or WebP image.";
  if (file.size > IMAGE_RULES.maxBytes) return "Choose an image of 2MB or less.";
  return null;
}
