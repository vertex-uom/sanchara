import { apiError, type ApiError } from "@/lib/api-client/errors";
import { loadDevStore, saveDevStore } from "@/lib/dev-store";
import type { PropertyBasicInfo, PropertySettings, PropertyStatus, PropertySummary } from "../types";

type StoredProperty = Omit<PropertySettings, "name" | "imageUrl">;

// TEMPORARY dev store so settings can be saved before the properties API
// exists. Replace this file with API calls; the signatures stay. Kept on
// globalThis so hot reload doesn't reset it, and in .dev-data/properties.json
// so a server restart doesn't either.
const holder = globalThis as typeof globalThis & { sancharaPropertyStore?: StoredProperty[] };

const STORE_NAME = "properties";

function store(): StoredProperty[] {
  holder.sancharaPropertyStore ??= loadDevStore(STORE_NAME, seed);
  return holder.sancharaPropertyStore;
}

const persist = () => saveDevStore(STORE_NAME, store());

function seed(): StoredProperty[] {
  return [
    {
      id: "palm-breeze",
      town: "Galle",
      country: "Sri Lanka",
      logoUrl: null,
      status: "active",
      version: 1,
      basic: {
        name: "Palm Breeze Guest House",
        type: "guest-house",
        description:
          "A comfortable guest house located in the heart of Galle, offering modern amenities and a relaxing atmosphere for both leisure and business travellers.",
        starRating: 3,
        establishedYear: 2020,
        category: "beachfront",
      },
    },
    {
      id: "lagoon-view",
      town: "Bentota",
      country: "Sri Lanka",
      logoUrl: null,
      status: "active",
      version: 1,
      basic: {
        name: "Lagoon View Villa",
        type: "villa",
        description: "A quiet villa on the Bentota lagoon with a private garden and boat trips at the door.",
        starRating: null,
        establishedYear: null,
        category: "lakeside",
      },
    },
  ];
}

const find = (propertyId: string) => store().find((property) => property.id === propertyId);
const notFound = () => apiError(404, "NOT_FOUND", "That property no longer exists.");

// The logo stands in for the property photo in the switcher until images exist.
export async function getCompanyProperties(): Promise<PropertySummary[]> {
  return store().map((property) => ({
    id: property.id,
    name: property.basic.name,
    town: property.town,
    country: property.country,
    imageUrl: property.logoUrl,
  }));
}

export async function getPropertySettings(propertyId: string): Promise<PropertySettings | null> {
  const property = find(propertyId);
  return property ? { ...property, name: property.basic.name, imageUrl: property.logoUrl } : null;
}

export async function updateBasicInfo(propertyId: string, version: number, basic: PropertyBasicInfo): Promise<ApiError | null> {
  const property = find(propertyId);
  if (!property) return notFound();
  if (property.version !== version) return apiError(409, "STALE", "These settings were changed somewhere else.");
  property.basic = basic;
  property.version += 1;
  persist();
  return null;
}

// TEMPORARY: kept as a data URL in memory. The API will store the file and return its URL.
export async function setPropertyLogo(propertyId: string, logo: { bytes: ArrayBuffer; type: string } | null): Promise<ApiError | null> {
  const property = find(propertyId);
  if (!property) return notFound();
  property.logoUrl = logo ? `data:${logo.type};base64,${Buffer.from(logo.bytes).toString("base64")}` : null;
  persist();
  return null;
}

export async function setPropertyStatus(propertyId: string, status: PropertyStatus): Promise<ApiError | null> {
  const property = find(propertyId);
  if (!property) return notFound();
  property.status = status;
  persist();
  return null;
}
