import type { PROPERTY_TYPES } from "./config";

export type PropertyType = (typeof PROPERTY_TYPES)[number];

export type FeaturedProperty = {
  slug: string;
  name: string;
  town: string;
  district: string;
  type: PropertyType;
  rating: number;
  imageUrl: string;
};
