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
    {
      slug: "misty-peak-bungalow",
      name: "Misty Peak Bungalow",
      town: "Nuwara Eliya",
      district: "Nuwara Eliya",
      type: "Bungalow",
      rating: 4.5,
      imageUrl: PROPERTY_IMAGE_URLS.mistyPeakBungalow,
    },
    {
      slug: "lagoon-eco-lodge",
      name: "Lagoon Eco Lodge",
      town: "Pasikudah",
      district: "Batticaloa",
      type: "Eco Lodge",
      rating: 4.4,
      imageUrl: PROPERTY_IMAGE_URLS.lagoonEcoLodge,
    },
    {
      slug: "kandy-lake-residence",
      name: "Kandy Lake Residence",
      town: "Kandy",
      district: "Kandy",
      type: "Hotel",
      rating: 4.6,
      imageUrl: PROPERTY_IMAGE_URLS.kandyLakeResidence,
    },
  ];
}
