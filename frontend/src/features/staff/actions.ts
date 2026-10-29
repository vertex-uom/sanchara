"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { apiError, type ApiError } from "@/lib/api-client/errors";
import { assignableRoles, can, canManageStaff, creatableRoles } from "@/lib/auth/permissions";
import { getCurrentStaff } from "@/lib/auth/current-staff";
import { STAFF_ROLES } from "@/lib/auth/staff";
import { STAFF_ERROR_MESSAGES, type StaffErrorCode } from "./config";
import { changeStaffRole, createStaff, deactivateStaff, getStaffMember, reactivateStaff } from "./server/staff";
import { safeStaffFilters, staffHref, type StaffFilters } from "./staff-params";
import { validateNewStaff, type NewStaffInput } from "./validation";

// Every action re-checks capabilities; the UI only hides what a user can't do.

// App route behind the proxy rewrite.
const STAFF_ROUTE = "/backoffice/company/staff";

export type AddStaffState = { error: ApiError | null; values: NewStaffInput };

function field(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function createStaffAction(_previous: AddStaffState, formData: FormData): Promise<AddStaffState> {
  const values = { fullName: field(formData, "fullName"), email: field(formData, "email"), role: field(formData, "role") };
  const user = await getCurrentStaff();
  if (!can(user, "staff.read")) return { error: apiError(403, "FORBIDDEN", "You can't add staff accounts."), values };

  const parsed = validateNewStaff(values, creatableRoles(user));
  if (!parsed.ok) {
    return { error: apiError(422, "VALIDATION_FAILED", "Check the highlighted fields.", parsed.fieldErrors), values };
  }
  const error = await createStaff(parsed.value);
  if (error) return { error, values };

  revalidatePath(STAFF_ROUTE);
  redirect(staffHref(safeStaffFilters(field(formData, "returnTo"))));
}

export async function changeRoleAction(formData: FormData) {
  const { filters, staffId, refusal, user } = await checkTarget(formData);
  const role = STAFF_ROLES.find((option) => option === field(formData, "role"));
  if (refusal || !role || !assignableRoles(user).includes(role)) finish(filters, refusal ?? "FORBIDDEN");
  finish(filters, errorCode(await changeStaffRole(staffId, role)));
}

export async function deactivateAction(formData: FormData) {
  const { filters, staffId, refusal } = await checkTarget(formData);
  finish(filters, refusal ?? errorCode(await deactivateStaff(staffId)));
}

export async function reactivateAction(formData: FormData) {
  const { filters, staffId, refusal } = await checkTarget(formData);
  finish(filters, refusal ?? errorCode(await reactivateStaff(staffId)));
}

// Shared checks for an action on one account.
async function checkTarget(formData: FormData) {
  const filters = safeStaffFilters(field(formData, "returnTo"));
  const staffId = field(formData, "staffId");
  const [user, member] = await Promise.all([getCurrentStaff(), getStaffMember(staffId)]);
  const refusal: StaffErrorCode | null = !member
    ? "NOT_FOUND"
    : !can(user, "staff.read") || !canManageStaff(user, member)
      ? "FORBIDDEN"
      : null;
  return { filters, staffId, refusal, user };
}

function errorCode(error: ApiError | null): StaffErrorCode | null {
  if (!error) return null;
  return Object.hasOwn(STAFF_ERROR_MESSAGES, error.code) ? (error.code as StaffErrorCode) : "FAILED";
}

// Back to the list (filters kept); a refusal shows its message there.
function finish(filters: StaffFilters, refusal: StaffErrorCode | null): never {
  if (!refusal) revalidatePath(STAFF_ROUTE);
  redirect(staffHref(filters, refusal ? { error: refusal } : {}));
}
