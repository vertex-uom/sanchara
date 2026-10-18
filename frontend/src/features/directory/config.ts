// Directory settings shared by the home page and the /properties search.

// Proposed list. Replace with the confirmed v8 property types.
export const PROPERTY_TYPES = [
  "Hotel",
  "Resort",
  "Boutique Villa",
  "Villa",
  "Guest House",
  "Homestay",
  "Bungalow",
  "Wellness Retreat",
  "Eco Lodge",
] as const;

// Location hints for the search field; guests can still type a town.
export const SRI_LANKA_DISTRICTS = [
  "Ampara", "Anuradhapura", "Badulla", "Batticaloa", "Colombo",
  "Galle", "Gampaha", "Hambantota", "Jaffna", "Kalutara",
  "Kandy", "Kegalle", "Kilinochchi", "Kurunegala", "Mannar",
  "Matale", "Matara", "Monaragala", "Mullaitivu", "Nuwara Eliya",
  "Polonnaruwa", "Puttalam", "Ratnapura", "Trincomalee", "Vavuniya",
] as const;

// TODO(confirm): v8 uses LKR for residents and USD for non-residents;
// the directory price-range currency is not decided yet.
export const PRICE_RANGE_CONFIG = { currency: "LKR", step: 500 } as const;

export const SEARCH_PATH = "/properties";

export function propertyHref(slug: string) {
  return `${SEARCH_PATH}/${encodeURIComponent(slug)}`;
}
