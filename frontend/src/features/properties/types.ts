export type PropertySummary = {
  id: string;
  name: string;
  town: string;
  country: string;
  imageUrl: string | null;
};

export type PropertyType =
  | "guest-house"
  | "hotel"
  | "boutique-hotel"
  | "villa"
  | "homestay"
  | "resort"
  | "bungalow"
  | "apartment";

export type PropertyCategory = "beachfront" | "city" | "hill-country" | "wildlife" | "lakeside" | "heritage" | "rural";

// "inactive": hidden from the website and booking channels.
export type PropertyStatus = "active" | "inactive";

export type PropertyBasicInfo = {
  name: string;
  type: PropertyType;
  description: string;
  starRating: number | null;
  establishedYear: number | null;
  category: PropertyCategory | null;
};

// Optional fields are null when not set.
export type PropertyContact = {
  phone: string;
  email: string;
  whatsapp: string | null;
  website: string | null;
  addressLine1: string;
  addressLine2: string | null;
  town: string;
  district: string | null;
  postalCode: string | null;
  country: string;
  mapUrl: string | null;
};

export type CancellationPolicy = "flexible" | "moderate" | "strict" | "non-refundable";

export type SmokingPolicy = "not-allowed" | "designated-areas" | "allowed";

export type PropertyPolicies = {
  // "HH:MM", Sri Lanka time.
  checkInFrom: string;
  checkInUntil: string | null;
  checkOutBy: string;
  cancellation: CancellationPolicy;
  childrenAllowed: boolean;
  petsAllowed: boolean;
  smoking: SmokingPolicy;
  houseRules: string;
};

export type PropertyImage = { id: string; url: string; caption: string };

export type PropertyIntegrations = {
  googleAnalyticsId: string | null;
  metaPixelId: string | null;
  googleBusinessUrl: string | null;
  tripAdvisorUrl: string | null;
  bookingComIcalUrl: string | null;
  airbnbIcalUrl: string | null;
};

export type PropertyAdvanced = {
  sltdaNumber: string | null;
  vatNumber: string | null;
  invoicePrefix: string;
  // How far ahead guests may book, and how late before arrival.
  bookingWindowDays: number;
  minNoticeHours: number;
};

export type PropertySettings = PropertySummary & {
  basic: PropertyBasicInfo;
  contact: PropertyContact;
  policies: PropertyPolicies;
  amenities: string[];
  images: PropertyImage[];
  coverImageId: string | null;
  integrations: PropertyIntegrations;
  advanced: PropertyAdvanced;
  logoUrl: string | null;
  status: PropertyStatus;
  // Bumped on every settings save; a stale save is refused.
  version: number;
};

// Tabs edited with "Edit settings"; images and the logo save as you go.
export type SettingsSection = "basic" | "contact" | "policies" | "amenities" | "images" | "integrations" | "advanced";
