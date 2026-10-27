"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { apiError, type ApiError } from "@/lib/api-client/errors";
import { can } from "@/lib/auth/permissions";
import { getCurrentStaff } from "@/lib/auth/staff";
import { PACKAGE_ERROR_MESSAGES, type PackageErrorCode } from "./config";
import { packagesHref, parsePackageParams } from "./package-params";
import { createPackage, deletePackage, updatePackage } from "./server/packages";
import { validateNewPackage, validatePackage, type NewPackageInput } from "./validation";

// App route behind the proxy rewrite.
const PACKAGES_ROUTE = "/backoffice/p/[propertyId]/packages";

const PROPERTY_ID = /^[a-z0-9_-]{1,64}$/;

function field(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function propertyIdFrom(formData: FormData) {
  const propertyId = field(formData, "propertyId");
  return PROPERTY_ID.test(propertyId) ? propertyId : null;
}

const forbidden = () => apiError(403, "FORBIDDEN", PACKAGE_ERROR_MESSAGES.FORBIDDEN);

// Packages are Management (Owner and Manager): every action re-checks.
async function mayManage() {
  return can(await getCurrentStaff(), "packages.manage");
}

export type NewPackageState = { error: ApiError | null; values: NewPackageInput };

export async function createPackageAction(_previous: NewPackageState, formData: FormData): Promise<NewPackageState> {
  const values = { name: field(formData, "name"), theme: field(formData, "theme"), nights: field(formData, "nights") };
  if (!(await mayManage())) return { error: forbidden(), values };
  const propertyId = propertyIdFrom(formData);
  if (!propertyId) return { error: apiError(400, "FAILED", PACKAGE_ERROR_MESSAGES.FAILED), values };

  const parsed = validateNewPackage(values);
  if (!parsed.ok) {
    return { error: apiError(422, "VALIDATION_FAILED", "Check the highlighted fields.", parsed.fieldErrors), values };
  }
  const { id } = await createPackage(propertyId, parsed.value);
  revalidatePath(PACKAGES_ROUTE, "page");
  // Filters are dropped so the new draft is in the list.
  redirect(packagesHref(propertyId, { status: null, q: "" }, { packageId: id }));
}

function errorCode(error: ApiError): PackageErrorCode {
  return Object.hasOwn(PACKAGE_ERROR_MESSAGES, error.code) ? (error.code as PackageErrorCode) : "FAILED";
}

// Back to the list (filters kept, nothing selected); a refusal shows its message there.
export async function deletePackageAction(formData: FormData) {
  const allowed = await mayManage();
  const propertyId = propertyIdFrom(formData);
  if (!propertyId) redirect("/");
  const { status, q } = parsePackageParams({ status: field(formData, "status"), q: field(formData, "q") });
  if (!allowed) redirect(packagesHref(propertyId, { status, q }, { error: "FORBIDDEN" }));
  const error = await deletePackage(propertyId, field(formData, "packageId"));
  // Already gone is the outcome the user asked for.
  if (error && error.code !== "NOT_FOUND") redirect(packagesHref(propertyId, { status, q }, { error: errorCode(error) }));
  revalidatePath(PACKAGES_ROUTE, "page");
  redirect(packagesHref(propertyId, { status, q }));
}

// saved counts successful saves, so the editor can announce each one.
export type SavePackageState = { error: ApiError | null; saved: number };

export async function savePackageAction(previous: SavePackageState, formData: FormData): Promise<SavePackageState> {
  if (!(await mayManage())) return { ...previous, error: forbidden() };
  const propertyId = propertyIdFrom(formData);
  const packageId = field(formData, "packageId");
  const version = Number(field(formData, "version"));
  let payload: unknown = null;
  try {
    payload = JSON.parse(field(formData, "payload"));
  } catch {
    // Treated like an empty package below.
  }
  if (!propertyId || !Number.isInteger(version)) {
    return { ...previous, error: apiError(400, "FAILED", PACKAGE_ERROR_MESSAGES.FAILED) };
  }

  const parsed = validatePackage(payload);
  if (!parsed.ok) {
    return { ...previous, error: apiError(422, "VALIDATION_FAILED", "Fix the highlighted fields, then save again.", parsed.fieldErrors) };
  }
  const error = await updatePackage(propertyId, packageId, version, parsed.value);
  if (error) {
    return { ...previous, error: { ...error, message: PACKAGE_ERROR_MESSAGES[errorCode(error)] } };
  }
  revalidatePath(PACKAGES_ROUTE, "page");
  return { error: null, saved: previous.saved + 1 };
}
