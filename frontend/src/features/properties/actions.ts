"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { apiError, type ApiError } from "@/lib/api-client/errors";
import { getCurrentStaff } from "@/lib/auth/staff";
import { colomboDateKey } from "@/lib/format/dates";
import { SETTINGS_ERROR_MESSAGES, type SettingsErrorCode } from "./config";
import { setPropertyLogo, setPropertyStatus, updateBasicInfo } from "./server/properties";
import { settingsHref } from "./settings-params";
import { logoError, validateBasicInfo } from "./validation";

// The property layout, so the shell's name and logo refresh too.
const PROPERTY_LAYOUT = "/backoffice/p/[propertyId]";

const PROPERTY_ID = /^[a-z0-9_-]{1,64}$/;

function field(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function propertyIdFrom(formData: FormData) {
  const propertyId = field(formData, "propertyId");
  return PROPERTY_ID.test(propertyId) ? propertyId : null;
}

function withMessage(error: ApiError): ApiError {
  const code: SettingsErrorCode = Object.hasOwn(SETTINGS_ERROR_MESSAGES, error.code) ? (error.code as SettingsErrorCode) : "FAILED";
  return { ...error, code, message: SETTINGS_ERROR_MESSAGES[code] };
}

const failed = () => apiError(400, "FAILED", SETTINGS_ERROR_MESSAGES.FAILED);

// saved counts successful saves, so the form can announce each one.
export type SettingsFormState = { error: ApiError | null; saved: number };

export async function saveBasicInfoAction(previous: SettingsFormState, formData: FormData): Promise<SettingsFormState> {
  await getCurrentStaff();
  const propertyId = propertyIdFrom(formData);
  const version = Number(field(formData, "version"));
  if (!propertyId || !Number.isInteger(version)) return { ...previous, error: failed() };

  const values = {
    name: field(formData, "name"),
    type: field(formData, "type"),
    description: field(formData, "description"),
    starRating: field(formData, "starRating"),
    establishedYear: field(formData, "establishedYear"),
    category: field(formData, "category"),
  };
  const parsed = validateBasicInfo(values, Number(colomboDateKey(new Date()).slice(0, 4)));
  if (!parsed.ok) {
    return { ...previous, error: apiError(422, "VALIDATION_FAILED", "Fix the highlighted fields, then save again.", parsed.fieldErrors) };
  }
  const error = await updateBasicInfo(propertyId, version, parsed.value);
  if (error) return { ...previous, error: withMessage(error) };
  revalidatePath(PROPERTY_LAYOUT, "layout");
  return { error: null, saved: previous.saved + 1 };
}

// Uploads replace the logo straight away; an empty "logo" field removes it.
export async function saveLogoAction(previous: SettingsFormState, formData: FormData): Promise<SettingsFormState> {
  await getCurrentStaff();
  const propertyId = propertyIdFrom(formData);
  if (!propertyId) return { ...previous, error: failed() };

  const file = formData.get("logo");
  let logo: { bytes: ArrayBuffer; type: string } | null = null;
  if (file instanceof File && file.size > 0) {
    const message = logoError(file);
    if (message) return { ...previous, error: apiError(422, "VALIDATION_FAILED", message, { logo: message }) };
    logo = { bytes: await file.arrayBuffer(), type: file.type };
  }
  const error = await setPropertyLogo(propertyId, logo);
  if (error) return { ...previous, error: withMessage(error) };
  revalidatePath(PROPERTY_LAYOUT, "layout");
  return { error: null, saved: previous.saved + 1 };
}

export async function setStatusAction(formData: FormData) {
  await getCurrentStaff();
  const propertyId = propertyIdFrom(formData);
  if (!propertyId) redirect("/");
  const status = field(formData, "status") === "inactive" ? "inactive" : "active";
  const error = await setPropertyStatus(propertyId, status);
  if (error) redirect(settingsHref(propertyId, { error: withMessage(error).code as SettingsErrorCode }));
  revalidatePath(PROPERTY_LAYOUT, "layout");
  redirect(settingsHref(propertyId));
}
