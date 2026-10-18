import type { FeaturedProperty } from "../types";
import { PROPERTY_IMAGE_URLS } from "./home-images";

// TEMPORARY fixture. Replace the body with the directory API call (featured
// placement) once the API client exists; the return type stays the same.
export async function getFeaturedProperties(): Promise<FeaturedProperty[]> {
  return [
    {
      slug: "sunrise-villa",
      name: "Sunrise Villa",
      town: "Mirissa",
      district: "Matara",
      type: "Boutique Villa",
      rating: 4.8,
      imageUrl: PROPERTY_IMAGE_URLS.sunriseVilla,
    },
    {
      slug: "ocean-breeze",
      name: "Ocean Breeze",
      town: "Unawatuna",
      district: "Galle",
      type: "Guest House",
      rating: 4.6,
      imageUrl: PROPERTY_IMAGE_URLS.oceanBreeze,
    },
    {
      slug: "serene-hills-retreat",
      name: "Serene Hills Retreat",
      town: "Ella",
      district: "Badulla",
      type: "Wellness Retreat",
      rating: 4.7,
      imageUrl: PROPERTY_IMAGE_URLS.sereneHillsRetreat,
    },
  ];
}
