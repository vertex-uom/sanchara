import "server-only";
import { apiError, type ApiError } from "@/lib/api-client/errors";
import { ApiError as RequestError } from "@/lib/api-client/server";
import { staffFetch } from "@/lib/auth/current-staff";
import type { StaffRole } from "@/lib/auth/staff";
import type { StaffFilters } from "../staff-params";
import type { DeactivationPreview, StaffList, StaffMember } from "../types";
import type { NewStaff } from "../validation";

// The company's staff through the API (/v1/staff). The API decides who may
// change whom; these return the refusal as an ApiError for the page to show.

function toFormError(error: unknown): ApiError {
  if (!(error instanceof RequestError)) throw error;
  const fieldErrors = Object.fromEntries(Object.entries(error.fieldErrors).map(([field, messages]) => [field, messages[0]]));
  return apiError(error.status, error.code, error.message, fieldErrors);
}

async function change(path: string, method: "POST" | "PUT", body?: unknown): Promise<ApiError | null> {
  try {
    await staffFetch(path, { method, body });
    return null;
  } catch (error) {
    return toFormError(error);
  }
}

export async function listStaff({ role, inactive, q }: StaffFilters): Promise<StaffList> {
  const query = new URLSearchParams();
  if (role) query.set("role", role);
  if (inactive) query.set("status", "inactive");
  if (q) query.set("q", q);
  return staffFetch<StaffList>(`/v1/staff${query.size ? `?${query}` : ""}`);
}

export async function getStaffMember(id: string): Promise<StaffMember | null> {
  const { members } = await staffFetch<StaffList>("/v1/staff");
  return members.find((member) => member.id === id) ?? null;
}

// Who does front-desk work, from the active accounts (see the staffing table
// in docs/frontend-architecture.md).
function frontDeskHolder(members: StaffMember[]): StaffRole {
  const roles = new Set(members.filter((member) => member.status === "active").map((member) => member.role));
  return roles.has("front-desk") ? "front-desk" : roles.has("manager") ? "manager" : "owner";
}

export async function previewDeactivation(id: string): Promise<DeactivationPreview> {
  const { members } = await staffFetch<StaffList>("/v1/staff");
  const before = frontDeskHolder(members);
  const after = frontDeskHolder(members.filter((member) => member.id !== id));
  return { frontDeskMovesTo: before === after ? null : after };
}

// Adds an invited account; the API emails the invite link.
export function createStaff(input: NewStaff) {
  return change("/v1/staff", "POST", input);
}

export function changeStaffRole(id: string, role: StaffRole) {
  return change(`/v1/staff/${encodeURIComponent(id)}/role`, "PUT", { role });
}

export function deactivateStaff(id: string) {
  return change(`/v1/staff/${encodeURIComponent(id)}/deactivate`, "POST");
}

export function reactivateStaff(id: string) {
  return change(`/v1/staff/${encodeURIComponent(id)}/reactivate`, "POST");
}

export function resendStaffInvite(id: string) {
  return change(`/v1/staff/${encodeURIComponent(id)}/invite`, "POST");
}
