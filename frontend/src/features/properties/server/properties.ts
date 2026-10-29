import "server-only";
import { cache } from "react";
import { apiError, type ApiError } from "@/lib/api-client/errors";
import { ApiError as RequestError } from "@/lib/api-client/server";
import { staffFetch } from "@/lib/auth/current-staff";
import { loadDevStore, saveDevStore } from "@/lib/dev-store";
import { IMAGE_RULES } from "../config";
import type { PropertyImage, PropertySettings, PropertyStatus, PropertySummary, SettingsSection } from "../types";
import type { SectionValue } from "../validation";

// What the API returns (GET /v1/properties, GET /v1/properties/:id/settings).
type ApiPropertySummary = Omit<PropertySummary, "imageUrl"> & { status: PropertyStatus };
type ApiPropertySettings = Omit<PropertySettings, "imageUrl" | "logoUrl" | "images" | "coverImageId">;

// TEMPORARY media store: the API doesn't store files yet, so the logo and the
// gallery stay in .dev-data/property-media.json as data URLs, keyed by property id.
type Media = { logoUrl: string | null; images: PropertyImage[]; coverImageId: string | null };

const holder = globalThis as typeof globalThis & { sancharaPropertyMedia?: Record<string, Media> };
const MEDIA_STORE = "property-media";

function mediaStore(): Record<string, Media> {
  holder.sancharaPropertyMedia ??= loadDevStore<Record<string, Media>>(MEDIA_STORE, () => ({}));
  return holder.sancharaPropertyMedia;
}

const mediaOf = (propertyId: string): Media => mediaStore()[propertyId] ?? { logoUrl: null, images: [], coverImageId: null };

function saveMedia(propertyId: string, media: Media) {
  mediaStore()[propertyId] = media;
  saveDevStore(MEDIA_STORE, mediaStore());
}

// The cover photo, else the logo, stands in for the property in the switcher.
function thumbnail(media: Media) {
  return media.images.find((image) => image.id === media.coverImageId)?.url ?? media.logoUrl;
}

const notFound = () => apiError(404, "NOT_FOUND", "That property no longer exists.");

// API failures as the form's error shape (first message per field).
function toFormError(error: unknown): ApiError {
  if (!(error instanceof RequestError)) throw error;
  const fieldErrors = Object.fromEntries(Object.entries(error.fieldErrors).map(([field, messages]) => [field, messages[0]]));
  if (error.code === "VALIDATION_FAILED") return apiError(422, error.code, "Fix the highlighted fields, then save again.", fieldErrors);
  return apiError(error.status, error.code, error.message, fieldErrors);
}

const settingsPath = (propertyId: string) => `/v1/properties/${encodeURIComponent(propertyId)}`;

// The signed-in user's company properties, oldest first. Once per request.
export const getCompanyProperties = cache(async (): Promise<PropertySummary[]> => {
  const { properties } = await staffFetch<{ properties: ApiPropertySummary[] }>("/v1/properties");
  return properties.map(({ id, name, town, country }) => ({ id, name, town, country, imageUrl: thumbnail(mediaOf(id)) }));
});

// Owner only (the API refuses everyone else). Null when the property isn't the company's.
export async function getPropertySettings(propertyId: string): Promise<PropertySettings | null> {
  try {
    const { property } = await staffFetch<{ property: ApiPropertySettings }>(`${settingsPath(propertyId)}/settings`);
    const media = mediaOf(propertyId);
    return { ...property, ...media, imageUrl: thumbnail(media) };
  } catch (error) {
    if (error instanceof RequestError && (error.status === 404 || error.status === 400)) return null;
    throw error;
  }
}

// Saves one "Edit settings" tab. Images saves captions only (media store).
export async function updateSection<S extends SettingsSection>(
  propertyId: string,
  version: number,
  section: S,
  value: SectionValue[S],
): Promise<ApiError | null> {
  if (section === "images") return saveCaptions(propertyId, value as SectionValue["images"]);
  const body = section === "amenities" ? { amenities: value } : value;
  try {
    await staffFetch(`${settingsPath(propertyId)}/settings/${section}`, { method: "PUT", body: { ...body, version } });
    return null;
  } catch (error) {
    return toFormError(error);
  }
}

export async function setPropertyStatus(propertyId: string, status: PropertyStatus): Promise<ApiError | null> {
  try {
    await staffFetch(`${settingsPath(propertyId)}/status`, { method: "PUT", body: { status } });
    return null;
  } catch (error) {
    return toFormError(error);
  }
}

// Media changes check the property through the API first (Owner, same company).
async function changeMedia(propertyId: string, change: (media: Media) => Media | ApiError): Promise<ApiError | null> {
  if (!(await getPropertySettings(propertyId))) return notFound();
  const next = change(mediaOf(propertyId));
  if ("code" in next) return next;
  saveMedia(propertyId, next);
  return null;
}

const dataUrl = (file: { bytes: ArrayBuffer; type: string }) => `data:${file.type};base64,${Buffer.from(file.bytes).toString("base64")}`;

function saveCaptions(propertyId: string, captions: Record<string, string>) {
  return changeMedia(propertyId, (media) => ({
    ...media,
    images: media.images.map((image) => ({ ...image, caption: captions[image.id] ?? image.caption })),
  }));
}

export function setPropertyLogo(propertyId: string, logo: { bytes: ArrayBuffer; type: string } | null) {
  return changeMedia(propertyId, (media) => ({ ...media, logoUrl: logo ? dataUrl(logo) : null }));
}

// The first photo becomes the cover.
export function addPropertyImage(propertyId: string, file: { bytes: ArrayBuffer; type: string }) {
  return changeMedia(propertyId, (media) => {
    if (media.images.length >= IMAGE_RULES.maxImages) return apiError(409, "LIMIT", "The gallery is full.");
    const image: PropertyImage = { id: `img_${Date.now().toString(36)}`, url: dataUrl(file), caption: "" };
    return { ...media, images: [...media.images, image], coverImageId: media.coverImageId ?? image.id };
  });
}

// Removing the cover makes the next photo the cover.
export function removePropertyImage(propertyId: string, imageId: string) {
  return changeMedia(propertyId, (media) => {
    const images = media.images.filter((image) => image.id !== imageId);
    return { ...media, images, coverImageId: media.coverImageId === imageId ? (images[0]?.id ?? null) : media.coverImageId };
  });
}

export function setCoverImage(propertyId: string, imageId: string) {
  return changeMedia(propertyId, (media) =>
    media.images.some((image) => image.id === imageId) ? { ...media, coverImageId: imageId } : apiError(404, "NOT_FOUND", "That image no longer exists."),
  );
}
