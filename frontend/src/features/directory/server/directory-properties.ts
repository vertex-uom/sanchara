import { DIRECTORY_PAGE_SIZE, PROPERTY_TYPES } from "../config";
import type { DirectoryProperty, DirectoryQuery, DirectorySearchResult, PropertyType } from "../types";

// TEMPORARY placeholder images, rotated through the brand palette.
const IMAGE_COLOURS = [
  ["38A392", "FFF9F1"],
  ["8FC7CF", "1C5B52"],
  ["1C5B52", "DDF3F4"],
  ["DDF3F4", "1C5B52"],
];

function placeholderImage(name: string, index: number) {
  const [background, text] = IMAGE_COLOURS[index % IMAGE_COLOURS.length];
  return `https://placehold.co/640x480/${background}/${text}/png?text=${encodeURIComponent(name)}`;
}

type FixtureRow = Omit<DirectoryProperty, "imageUrl">;

// TEMPORARY fixture, from the Discover design plus fillers. Replace with the
// directory API (which also filters out suspended companies).
const FIXTURE: FixtureRow[] = [
  { slug: "sunrise-villa", name: "Sunrise Villa", town: "Pinnawala", district: "Matale", type: "Boutique Villa", rating: 4.8, reviewCount: 128, featured: true, websiteHost: "sunrisevilla.sanchara.lk" },
  { slug: "ocean-breeze", name: "Ocean Breeze", town: "Unawatuna", district: "Galle", type: "Guest House", rating: 4.6, reviewCount: 214, featured: true, websiteHost: "oceanbreeze.lk" },
  { slug: "serene-hills-retreat", name: "Serene Hills Retreat", town: "Ella", district: "Badulla", type: "Wellness Retreat", rating: 4.7, reviewCount: 96, featured: true, websiteHost: "serenehills.sanchara.lk" },
  { slug: "lagoon-view-bungalow", name: "Lagoon View Bungalow", town: "Galle", district: "Galle", type: "Bungalow", rating: 4.9, reviewCount: 342, featured: true, websiteHost: "lagoonview.sanchara.lk" },
  { slug: "tea-hill-home-stay", name: "Tea Hill Home Stay", town: "Nuwara Eliya", district: "Nuwara Eliya", type: "Home Stay", rating: 4.5, reviewCount: 74, featured: false, websiteHost: "teahill.sanchara.lk" },
  { slug: "palm-breeze-villa", name: "Palm Breeze Villa", town: "Matara", district: "Matara", type: "Boutique Villa", rating: 4.7, reviewCount: 158, featured: false, websiteHost: "palmbreeze.sanchara.lk" },
  { slug: "forest-edge-villa", name: "Forest Edge Villa", town: "Ella", district: "Badulla", type: "Boutique Villa", rating: 4.8, reviewCount: 88, featured: false, websiteHost: "forestedge.sanchara.lk" },
  { slug: "coral-bay-surf-camp", name: "Coral Bay Surf Camp", town: "Hikkaduwa", district: "Galle", type: "Surf Camp", rating: 4.5, reviewCount: 201, featured: true, websiteHost: "coralbay.sanchara.lk" },
  { slug: "sigiriya-rock-guest-house", name: "Sigiriya Rock Guest House", town: "Sigiriya", district: "Matale", type: "Guest House", rating: 4.6, reviewCount: 119, featured: false, websiteHost: "sigiriyarock.sanchara.lk" },
  { slug: "kandy-lake-guest-house", name: "Kandy Lake Guest House", town: "Kandy", district: "Kandy", type: "Guest House", rating: 4.4, reviewCount: 163, featured: false, websiteHost: "kandylake.sanchara.lk" },
  { slug: "mirissa-bay-home-stay", name: "Mirissa Bay Home Stay", town: "Mirissa", district: "Matara", type: "Home Stay", rating: 4.6, reviewCount: 92, featured: false, websiteHost: "mirissabay.sanchara.lk" },
  { slug: "arugam-point-surf-camp", name: "Arugam Point Surf Camp", town: "Arugam Bay", district: "Ampara", type: "Surf Camp", rating: 4.7, reviewCount: 176, featured: false, websiteHost: "arugampoint.sanchara.lk" },
  { slug: "knuckles-mist-bungalow", name: "Knuckles Mist Bungalow", town: "Rangala", district: "Kandy", type: "Bungalow", rating: 4.3, reviewCount: 41, featured: false, websiteHost: "knucklesmist.sanchara.lk" },
  { slug: "jaffna-heritage-home-stay", name: "Jaffna Heritage Home Stay", town: "Jaffna", district: "Jaffna", type: "Home Stay", rating: 4.5, reviewCount: 58, featured: false, websiteHost: "jaffnaheritage.sanchara.lk" },
  { slug: "nilaveli-shore-guest-house", name: "Nilaveli Shore Guest House", town: "Nilaveli", district: "Trincomalee", type: "Guest House", rating: 4.2, reviewCount: 67, featured: false, websiteHost: "nilavelishore.sanchara.lk" },
  { slug: "bentota-ayurveda-retreat", name: "Bentota Ayurveda Retreat", town: "Bentota", district: "Galle", type: "Wellness Retreat", rating: 4.8, reviewCount: 133, featured: false, websiteHost: "bentotaayurveda.sanchara.lk" },
  { slug: "haputale-cloud-villa", name: "Haputale Cloud Villa", town: "Haputale", district: "Badulla", type: "Boutique Villa", rating: 4.4, reviewCount: 52, featured: false, websiteHost: "haputalecloud.sanchara.lk" },
];

const PROPERTIES: DirectoryProperty[] = FIXTURE.map((row, index) => ({ ...row, imageUrl: placeholderImage(row.name, index) }));

function matchesLocation(property: DirectoryProperty, location: string) {
  const needle = location.toLowerCase();
  return property.town.toLowerCase().includes(needle) || property.district.toLowerCase().includes(needle);
}

const SORTERS: Record<DirectoryQuery["sort"], (a: DirectoryProperty, b: DirectoryProperty) => number> = {
  recommended: (a, b) => Number(b.featured) - Number(a.featured),
  rating: (a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount,
  reviews: (a, b) => b.reviewCount - a.reviewCount,
};

// TEMPORARY: filters the fixture in memory. Replace the body with the
// directory API call; the signature and return type stay the same.
export async function searchDirectory(query: DirectoryQuery): Promise<DirectorySearchResult> {
  const base = PROPERTIES.filter(
    (property) =>
      (!query.location || matchesLocation(property, query.location)) &&
      (query.minRating === null || property.rating >= query.minRating),
  );

  const typeCounts = Object.fromEntries(
    PROPERTY_TYPES.map((type) => [type, base.filter((property) => property.type === type).length]),
  ) as Record<PropertyType, number>;

  const matches = base
    .filter((property) => query.types.length === 0 || query.types.includes(property.type))
    .sort(SORTERS[query.sort]);

  return {
    properties: matches.slice(0, query.page * DIRECTORY_PAGE_SIZE),
    total: matches.length,
    typeCounts,
  };
}

// TEMPORARY: featured placements for /properties. Replace with the directory API.
export async function getFeaturedStays(): Promise<DirectoryProperty[]> {
  return PROPERTIES.filter((property) => property.featured);
}
