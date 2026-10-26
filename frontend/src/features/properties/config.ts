import type { PropertyCategory, PropertyType } from "./types";

export type SettingsTab = "basic" | "contact" | "policies" | "amenities" | "images" | "integrations" | "advanced";

export const SETTINGS_TABS: { key: SettingsTab; label: string }[] = [
  { key: "basic", label: "Basic Information" },
  { key: "contact", label: "Contact & Location" },
  { key: "policies", label: "Policies" },
  { key: "amenities", label: "Amenities" },
  { key: "images", label: "Images" },
  { key: "integrations", label: "Integrations" },
  { key: "advanced", label: "Advanced" },
];

// TODO(confirm): v8 has not listed property types or categories; the API
// should supply them. These match the design's examples.
export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  "guest-house": "Guest House",
  hotel: "Hotel",
  "boutique-hotel": "Boutique Hotel",
  villa: "Villa",
  homestay: "Homestay",
  resort: "Resort",
  bungalow: "Bungalow",
  apartment: "Apartment",
};

export const PROPERTY_CATEGORY_LABELS: Record<PropertyCategory, string> = {
  beachfront: "Beachfront",
  city: "City",
  "hill-country": "Hill country",
  wildlife: "Wildlife",
  lakeside: "Lakeside",
  heritage: "Heritage",
  rural: "Rural",
};

export const BASIC_LIMITS = { name: 100, description: 250, minYear: 1800 } as const;

// From the design: "Recommended size: 512 × 512 px. JPG, PNG (Max 2MB)".
export const LOGO_RULES = { types: ["image/png", "image/jpeg"], maxBytes: 2 * 1024 * 1024, recommendedPx: 512 } as const;

export const SETTINGS_ERROR_MESSAGES = {
  NOT_FOUND: "That property no longer exists.",
  STALE: "These settings were changed somewhere else. Reload the page to see the latest version.",
  FAILED: "Something went wrong. Try again.",
} as const;

export type SettingsErrorCode = keyof typeof SETTINGS_ERROR_MESSAGES;
