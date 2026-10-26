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

export type PropertySettings = PropertySummary & {
  basic: PropertyBasicInfo;
  logoUrl: string | null;
  status: PropertyStatus;
  // Bumped on every basic-information save; a stale save is refused.
  version: number;
};
