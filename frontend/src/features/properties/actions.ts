"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { apiError, type ApiError } from "@/lib/api-client/errors";
import { can } from "@/lib/auth/permissions";
import { getCurrentStaff } from "@/lib/auth/current-staff";
import { colomboDateKey } from "@/lib/format/dates";
import { SETTINGS_ERROR_MESSAGES, SETTINGS_TABS, type SettingsErrorCode } from "./config";
import {
  addPropertyImage,
  removePropertyImage,
  setCoverImage,
  setPropertyLogo,
  setPropertyStatus,
  updateSection,
} from "./server/properties";
import { settingsHref } from "./settings-params";
import type { SettingsSection } from "./types";
import { imageError, logoError, validateSection, type FormValues } from "./validation";

// The property layout, so the shell's name, location and photo refresh too.
const PROPERTY_LAYOUT = "/backoffice/p/[propertyId]";

const PROPERTY_ID = /^[a-z0-9_-]{1,64}$/;

// Hidden fields every settings form sends; the rest are the section's values.
const CONTROL_FIELDS = new Set(["propertyId", "version", "section"]);

function field(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function propertyIdFrom(formData: FormData) {
  const propertyId = field(formData, "propertyId");
  return PROPERTY_ID.test(propertyId) ? propertyId : null;
}

// Repeated names (checkbox groups) are comma-joined; files are ignored.
function formValues(formData: FormData): FormValues {
  const values: FormValues = {};
  for (const [key, value] of formData.entries()) {
    if (CONTROL_FIELDS.has(key) || key.startsWith("$") || typeof value !== "string") continue;
    values[key] = key in values ? `${values[key]},${value}` : value;
  }
  return values;
}

// Field errors from the API keep their messages; anything else gets the page's wording.
function withMessage(error: ApiError): ApiError {
  if (error.code === "VALIDATION_FAILED") return error;
  const code: SettingsErrorCode = Object.hasOwn(SETTINGS_ERROR_MESSAGES, error.code) ? (error.code as SettingsErrorCode) : "FAILED";
  return { ...error, code, message: SETTINGS_ERROR_MESSAGES[code] };
}

const failed = () => apiError(400, "FAILED", SETTINGS_ERROR_MESSAGES.FAILED);
const forbidden = () => apiError(403, "FORBIDDEN", SETTINGS_ERROR_MESSAGES.FORBIDDEN);

// Property settings are the Owner's: every action re-checks; the page only
// hides what a user can't do.
async function mayEdit() {
  return can(await getCurrentStaff(), "settings.manage");
}

// saved counts successful saves, so the form can announce each one.
export type SettingsFormState = { error: ApiError | null; saved: number };

// Saves one "Edit settings" tab (the hidden "section" field says which).
export async function saveSectionAction(previous: SettingsFormState, formData: FormData): Promise<SettingsFormState> {
  if (!(await mayEdit())) return { ...previous, error: forbidden() };
  const propertyId = propertyIdFrom(formData);
  const version = Number(field(formData, "version"));
  const section = SETTINGS_TABS.find(({ key }) => key === field(formData, "section"))?.key;
  if (!propertyId || !section || !Number.isInteger(version)) return { ...previous, error: failed() };

  const parsed = validateSection(section, formValues(formData), Number(colomboDateKey(new Date()).slice(0, 4)));
  if (!parsed.ok) {
    return { ...previous, error: apiError(422, "VALIDATION_FAILED", "Fix the highlighted fields, then save again.", parsed.fieldErrors) };
  }
  const error = await updateSection<SettingsSection>(propertyId, version, section, parsed.value);
  if (error) return { ...previous, error: withMessage(error) };
  revalidatePath(PROPERTY_LAYOUT, "layout");
  return { error: null, saved: previous.saved + 1 };
}

async function upload(formData: FormData, name: string, check: (file: File) => string | null) {
  const file = formData.get(name);
  if (!(file instanceof File) || file.size === 0) return { file: null, message: null };
  const message = check(file);
  return { file: message ? null : { bytes: await file.arrayBuffer(), type: file.type }, message };
}

// Uploads replace the logo straight away; an empty "logo" field removes it.
export async function saveLogoAction(previous: SettingsFormState, formData: FormData): Promise<SettingsFormState> {
  if (!(await mayEdit())) return { ...previous, error: forbidden() };
  const propertyId = propertyIdFrom(formData);
  if (!propertyId) return { ...previous, error: failed() };

  const { file, message } = await upload(formData, "logo", logoError);
  if (message) return { ...previous, error: apiError(422, "VALIDATION_FAILED", message, { logo: message }) };
  const error = await setPropertyLogo(propertyId, file);
  if (error) return { ...previous, error: withMessage(error) };
  revalidatePath(PROPERTY_LAYOUT, "layout");
  return { error: null, saved: previous.saved + 1 };
}

export async function addImageAction(previous: SettingsFormState, formData: FormData): Promise<SettingsFormState> {
  if (!(await mayEdit())) return { ...previous, error: forbidden() };
  const propertyId = propertyIdFrom(formData);
  if (!propertyId) return { ...previous, error: failed() };

  const { file, message } = await upload(formData, "image", imageError);
  if (message || !file) {
    const text = message ?? "Choose an image to upload.";
    return { ...previous, error: apiError(422, "VALIDATION_FAILED", text, { image: text }) };
  }
  const error = await addPropertyImage(propertyId, file);
  if (error) return { ...previous, error: withMessage(error) };
  revalidatePath(PROPERTY_LAYOUT, "layout");
  return { error: null, saved: previous.saved + 1 };
}

// Gallery buttons (Set as cover, Remove): back to the Images tab, with a message if refused.
async function imageChange(formData: FormData, change: (propertyId: string, imageId: string) => Promise<ApiError | null>) {
  const allowed = await mayEdit();
  const propertyId = propertyIdFrom(formData);
  if (!propertyId) redirect("/");
  if (!allowed) redirect(settingsHref(propertyId, { tab: "images", error: "FORBIDDEN" }));
  const error = await change(propertyId, field(formData, "imageId"));
  if (error) redirect(settingsHref(propertyId, { tab: "images", error: withMessage(error).code as SettingsErrorCode }));
  revalidatePath(PROPERTY_LAYOUT, "layout");
  redirect(settingsHref(propertyId, { tab: "images" }));
}

export async function removeImageAction(formData: FormData) {
  await imageChange(formData, removePropertyImage);
}

export async function setCoverAction(formData: FormData) {
  await imageChange(formData, setCoverImage);
}

export async function setStatusAction(formData: FormData) {
  const allowed = await mayEdit();
  const propertyId = propertyIdFrom(formData);
  if (!propertyId) redirect("/");
  if (!allowed) redirect(settingsHref(propertyId, { error: "FORBIDDEN" }));
  const status = field(formData, "status") === "inactive" ? "inactive" : "active";
  const error = await setPropertyStatus(propertyId, status);
  if (error) redirect(settingsHref(propertyId, { error: withMessage(error).code as SettingsErrorCode }));
  revalidatePath(PROPERTY_LAYOUT, "layout");
  redirect(settingsHref(propertyId));
}
