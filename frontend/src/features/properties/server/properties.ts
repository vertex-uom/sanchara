import { apiError, type ApiError } from "@/lib/api-client/errors";
import { loadDevStore, saveDevStore } from "@/lib/dev-store";
import { IMAGE_RULES } from "../config";
import type { PropertyImage, PropertySettings, PropertyStatus, PropertySummary, SettingsSection } from "../types";
import type { SectionValue } from "../validation";

type StoredProperty = Omit<PropertySettings, "name" | "imageUrl" | "town" | "country">;

// TEMPORARY dev store so settings can be saved before the properties API
// exists. Replace this file with API calls; the signatures stay. Kept on
// globalThis so hot reload doesn't reset it, and in .dev-data/properties.json
// so a server restart doesn't either.
const holder = globalThis as typeof globalThis & { sancharaPropertyStore?: StoredProperty[] };

const STORE_NAME = "properties";

function store(): StoredProperty[] {
  holder.sancharaPropertyStore ??= loadDevStore(STORE_NAME, seed);
  // Upgrades entries saved (or held in memory across hot reloads) before a section existed.
  if (holder.sancharaPropertyStore.some((property) => !property.contact || !property.advanced)) {
    holder.sancharaPropertyStore = holder.sancharaPropertyStore.map(withDefaults);
  }
  return holder.sancharaPropertyStore;
}

const persist = () => saveDevStore(STORE_NAME, store());

// Sections every property gets until it saves its own.
function defaults(town: string, country: string): Omit<StoredProperty, "id" | "basic" | "logoUrl" | "status" | "version"> {
  return {
    contact: {
      phone: "+94 91 222 3344",
      email: "stay@example.com",
      whatsapp: null,
      website: null,
      addressLine1: "12 Lighthouse Street",
      addressLine2: null,
      town,
      district: null,
      postalCode: null,
      country,
      mapUrl: null,
    },
    policies: {
      checkInFrom: "14:00",
      checkInUntil: "22:00",
      checkOutBy: "11:00",
      cancellation: "moderate",
      childrenAllowed: true,
      petsAllowed: false,
      smoking: "designated-areas",
      houseRules: "",
    },
    amenities: ["wifi", "parking", "air-conditioning", "breakfast"],
    images: [],
    coverImageId: null,
    integrations: {
      googleAnalyticsId: null,
      metaPixelId: null,
      googleBusinessUrl: null,
      tripAdvisorUrl: null,
      bookingComIcalUrl: null,
      airbnbIcalUrl: null,
    },
    advanced: { sltdaNumber: null, vatNumber: null, invoicePrefix: "INV", bookingWindowDays: 365, minNoticeHours: 0 },
  };
}

// Files saved before these sections existed kept town and country at the top level.
function withDefaults(stored: StoredProperty & { town?: string; country?: string }): StoredProperty {
  const { town = "", country = "Sri Lanka", ...rest } = stored;
  return { ...defaults(town, country), ...rest };
}

function seed(): StoredProperty[] {
  return [
    {
      ...defaults("Galle", "Sri Lanka"),
      id: "palm-breeze",
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
      ...defaults("Bentota", "Sri Lanka"),
      id: "lagoon-view",
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

// The cover photo, else the logo, stands in for the property in the switcher.
function thumbnail(property: StoredProperty) {
  return property.images.find((image) => image.id === property.coverImageId)?.url ?? property.logoUrl;
}

export async function getCompanyProperties(): Promise<PropertySummary[]> {
  return store().map((property) => ({
    id: property.id,
    name: property.basic.name,
    town: property.contact.town,
    country: property.contact.country,
    imageUrl: thumbnail(property),
  }));
}

export async function getPropertySettings(propertyId: string): Promise<PropertySettings | null> {
  const property = find(propertyId);
  if (!property) return null;
  return { ...property, name: property.basic.name, town: property.contact.town, country: property.contact.country, imageUrl: thumbnail(property) };
}

// Saves one "Edit settings" tab. Images saves captions only, for images that still exist.
export async function updateSection<S extends SettingsSection>(
  propertyId: string,
  version: number,
  section: S,
  value: SectionValue[S],
): Promise<ApiError | null> {
  const property = find(propertyId);
  if (!property) return notFound();
  if (property.version !== version) return apiError(409, "STALE", "These settings were changed somewhere else.");
  if (section === "images") {
    const captions = value as SectionValue["images"];
    property.images = property.images.map((image) => ({ ...image, caption: captions[image.id] ?? image.caption }));
  } else {
    Object.assign(property, { [section]: value });
  }
  property.version += 1;
  persist();
  return null;
}

const dataUrl = (file: { bytes: ArrayBuffer; type: string }) => `data:${file.type};base64,${Buffer.from(file.bytes).toString("base64")}`;

// TEMPORARY: logos and photos are kept as data URLs. The API will store the files and return URLs.
export async function setPropertyLogo(propertyId: string, logo: { bytes: ArrayBuffer; type: string } | null): Promise<ApiError | null> {
  const property = find(propertyId);
  if (!property) return notFound();
  property.logoUrl = logo ? dataUrl(logo) : null;
  persist();
  return null;
}

// The first photo becomes the cover.
export async function addPropertyImage(propertyId: string, file: { bytes: ArrayBuffer; type: string }): Promise<ApiError | null> {
  const property = find(propertyId);
  if (!property) return notFound();
  if (property.images.length >= IMAGE_RULES.maxImages) return apiError(409, "LIMIT", "The gallery is full.");
  const image: PropertyImage = { id: `img_${Date.now().toString(36)}`, url: dataUrl(file), caption: "" };
  property.images.push(image);
  property.coverImageId ??= image.id;
  persist();
  return null;
}

// Removing the cover makes the next photo the cover.
export async function removePropertyImage(propertyId: string, imageId: string): Promise<ApiError | null> {
  const property = find(propertyId);
  if (!property) return notFound();
  property.images = property.images.filter((image) => image.id !== imageId);
  if (property.coverImageId === imageId) property.coverImageId = property.images[0]?.id ?? null;
  persist();
  return null;
}

export async function setCoverImage(propertyId: string, imageId: string): Promise<ApiError | null> {
  const property = find(propertyId);
  if (!property) return notFound();
  if (!property.images.some((image) => image.id === imageId)) return apiError(404, "NOT_FOUND", "That image no longer exists.");
  property.coverImageId = imageId;
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
