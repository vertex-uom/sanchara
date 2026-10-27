import type { CancellationPolicy, PropertyCategory, PropertyType, SettingsSection, SmokingPolicy } from "./types";

export type SettingsTab = SettingsSection;

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

// TODO(confirm): v8 has not set gallery limits. 2MB keeps each upload under
// the Server Action body limit in next.config.ts.
export const IMAGE_RULES = {
  types: ["image/png", "image/jpeg", "image/webp"],
  maxBytes: 2 * 1024 * 1024,
  maxImages: 20,
  caption: 120,
} as const;

export const SRI_LANKA_DISTRICTS = [
  "Ampara", "Anuradhapura", "Badulla", "Batticaloa", "Colombo", "Galle", "Gampaha", "Hambantota", "Jaffna",
  "Kalutara", "Kandy", "Kegalle", "Kilinochchi", "Kurunegala", "Mannar", "Matale", "Matara", "Monaragala",
  "Mullaitivu", "Nuwara Eliya", "Polonnaruwa", "Puttalam", "Ratnapura", "Trincomalee", "Vavuniya",
] as const;

// TODO(confirm): v8 has not defined cancellation rules; the API should own the
// wording and the refund logic. These are common presets.
export const CANCELLATION_META: Record<CancellationPolicy, { label: string; description: string }> = {
  flexible: { label: "Flexible", description: "Free cancellation up to 24 hours before check-in." },
  moderate: { label: "Moderate", description: "Free cancellation up to 5 days before check-in." },
  strict: { label: "Strict", description: "50% refund up to 7 days before check-in, none after." },
  "non-refundable": { label: "Non-refundable", description: "No refund after booking." },
};

export const SMOKING_LABELS: Record<SmokingPolicy, string> = {
  "not-allowed": "Not allowed",
  "designated-areas": "Designated areas only",
  allowed: "Allowed",
};

export const POLICY_LIMITS = { houseRules: 1000 } as const;

// TODO(confirm): v8 has not listed amenities; the API should supply them.
export const AMENITY_GROUPS: { label: string; items: { key: string; label: string }[] }[] = [
  {
    label: "General",
    items: [
      { key: "wifi", label: "Free Wi-Fi" },
      { key: "parking", label: "Free parking" },
      { key: "air-conditioning", label: "Air conditioning" },
      { key: "front-desk-24h", label: "24-hour front desk" },
      { key: "laundry", label: "Laundry service" },
      { key: "luggage-storage", label: "Luggage storage" },
    ],
  },
  {
    label: "Food & drink",
    items: [
      { key: "restaurant", label: "Restaurant" },
      { key: "bar", label: "Bar" },
      { key: "breakfast", label: "Breakfast available" },
      { key: "room-service", label: "Room service" },
    ],
  },
  {
    label: "Outdoors & leisure",
    items: [
      { key: "pool", label: "Swimming pool" },
      { key: "garden", label: "Garden" },
      { key: "beach-access", label: "Beach access" },
      { key: "bbq", label: "BBQ facilities" },
      { key: "spa", label: "Spa" },
      { key: "fitness", label: "Fitness centre" },
    ],
  },
  {
    label: "Services",
    items: [
      { key: "airport-transfer", label: "Airport transfer" },
      { key: "tour-desk", label: "Tour desk" },
      { key: "bicycle-rental", label: "Bicycle rental" },
      { key: "family-rooms", label: "Family rooms" },
    ],
  },
  {
    label: "Accessibility",
    items: [
      { key: "wheelchair", label: "Wheelchair accessible" },
      { key: "lift", label: "Lift" },
      { key: "ground-floor", label: "Ground-floor rooms" },
    ],
  },
];

export const AMENITY_KEYS: readonly string[] = AMENITY_GROUPS.flatMap((group) => group.items.map((item) => item.key));

// TODO(confirm): v8 has not decided booking rules; these bounds keep input sane.
export const ADVANCED_LIMITS = {
  bookingWindowDays: { min: 30, max: 730 },
  minNoticeHours: { min: 0, max: 72 },
} as const;

// Fixed for every property (docs/backend-architecture.md); shown read-only.
export const PROPERTY_TIME_ZONE = "Asia/Colombo (UTC+05:30)";
export const PROPERTY_CURRENCIES = "LKR for residents, USD for non-residents";

export const SETTINGS_ERROR_MESSAGES = {
  NOT_FOUND: "That property no longer exists.",
  STALE: "These settings were changed somewhere else. Reload the page to see the latest version.",
  LIMIT: "The gallery is full. Remove an image before adding another.",
  FORBIDDEN: "Only the Owner can change property settings.",
  FAILED: "Something went wrong. Try again.",
} as const;

export type SettingsErrorCode = keyof typeof SETTINGS_ERROR_MESSAGES;
