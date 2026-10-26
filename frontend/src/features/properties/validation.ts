import { BASIC_LIMITS, LOGO_RULES, PROPERTY_CATEGORY_LABELS, PROPERTY_TYPE_LABELS } from "./config";
import type { PropertyBasicInfo, PropertyCategory, PropertyType } from "./types";

// Form values as text; "" means "not set" for the optional fields.
export type BasicInfoInput = {
  name: string;
  type: string;
  description: string;
  starRating: string;
  establishedYear: string;
  category: string;
};

type Result<T> = { ok: true; value: T } | { ok: false; fieldErrors: Record<string, string> };

const isType = (value: string): value is PropertyType => Object.hasOwn(PROPERTY_TYPE_LABELS, value);
const isCategory = (value: string): value is PropertyCategory => Object.hasOwn(PROPERTY_CATEGORY_LABELS, value);

// The one schema for the Basic Information tab.
export function validateBasicInfo(input: BasicInfoInput, currentYear: number): Result<PropertyBasicInfo> {
  const errors: Record<string, string> = {};
  const name = input.name.trim();
  const description = input.description.trim();
  const year = input.establishedYear.trim();
  const stars = input.starRating;

  if (!name) errors.name = "Enter the property name.";
  else if (name.length > BASIC_LIMITS.name) errors.name = `Use ${BASIC_LIMITS.name} characters or fewer.`;
  if (!isType(input.type)) errors.type = "Choose a property type.";
  if (!description) errors.description = "Enter a short description.";
  else if (description.length > BASIC_LIMITS.description) errors.description = `Use ${BASIC_LIMITS.description} characters or fewer.`;
  if (stars && !/^[1-5]$/.test(stars)) errors.starRating = "Choose a star rating.";
  if (year && (!/^\d{4}$/.test(year) || Number(year) < BASIC_LIMITS.minYear || Number(year) > currentYear)) {
    errors.establishedYear = `Enter a year from ${BASIC_LIMITS.minYear} to ${currentYear}.`;
  }
  if (input.category && !isCategory(input.category)) errors.category = "Choose a category.";

  if (!isType(input.type) || Object.keys(errors).length > 0) return { ok: false, fieldErrors: errors };
  return {
    ok: true,
    value: {
      name,
      type: input.type,
      description,
      starRating: stars ? Number(stars) : null,
      establishedYear: year ? Number(year) : null,
      category: input.category && isCategory(input.category) ? input.category : null,
    },
  };
}

// Size and type only; the recommended dimensions are advice, not a rule.
export function logoError(file: { size: number; type: string }) {
  if (!(LOGO_RULES.types as readonly string[]).includes(file.type)) return "Choose a JPG or PNG image.";
  if (file.size > LOGO_RULES.maxBytes) return "Choose an image of 2MB or less.";
  return null;
}
