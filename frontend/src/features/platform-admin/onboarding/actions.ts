"use server";

import { ApiError } from "@/lib/api-client/server";
import { adminFetch } from "@/lib/auth/admin";
import type { CompanyDraft, CreatedCompany } from "../types";
import { API_FIELDS, toRequestBody, validateStep, type StepErrors } from "./draft";

export type CreateCompanyResult = { ok: true; created: CreatedCompany } | { ok: false; message: string; fieldErrors: StepErrors };

export type SubdomainAvailability = { subdomain: string; available: boolean; reason: "invalid" | "reserved" | "taken" | null };

const GENERIC_ERROR = "Something went wrong. Please try again.";

// API field errors (e.g. "owner.email") → the wizard's fields.
function toStepErrors(fieldErrors: Record<string, string[]>): StepErrors {
  const errors: StepErrors = {};
  for (const [path, messages] of Object.entries(fieldErrors)) {
    const field = API_FIELDS[path];
    if (field && messages[0]) errors[field] ??= messages[0];
  }
  return errors;
}

export async function createCompany(draft: CompanyDraft): Promise<CreateCompanyResult> {
  // The browser checked already; re-check here since actions take any input.
  const errors = { ...validateStep("company", draft, []), ...validateStep("property", draft, []), ...validateStep("owner", draft, []) };
  if (Object.keys(errors).length > 0) return { ok: false, message: "Some fields need attention.", fieldErrors: errors };

  try {
    const created = await adminFetch<CreatedCompany>("/v1/admin/companies", { method: "POST", body: toRequestBody(draft) });
    return { ok: true, created };
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    const fieldErrors = toStepErrors(error.fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return { ok: false, message: error.message, fieldErrors };
    if (error.code === "API_UNREACHABLE") return { ok: false, message: error.message, fieldErrors: {} };
    return { ok: false, message: GENERIC_ERROR, fieldErrors: {} };
  }
}

// Null when the check itself failed; the form then just waits for Create.
export async function checkSubdomain(subdomain: string): Promise<SubdomainAvailability | null> {
  try {
    return await adminFetch<SubdomainAvailability>(`/v1/admin/subdomains/${encodeURIComponent(subdomain)}/availability`);
  } catch (error) {
    if (error instanceof ApiError) return null;
    throw error;
  }
}

export type ReissueResult = { ok: true; expiresAt: string } | { ok: false; message: string };

// Emails the Owner a new invite link; the previous one stops working. The API
// never returns a re-issued link, so only the Owner's inbox has it.
export async function reissueOwnerInvite(companyId: string): Promise<ReissueResult> {
  try {
    const { invite } = await adminFetch<{ invite: { expiresAt: string } }>(`/v1/admin/companies/${encodeURIComponent(companyId)}/owner-invite`, { method: "POST" });
    return { ok: true, expiresAt: invite.expiresAt };
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    if (error.code === "OWNER_ALREADY_ACTIVE") return { ok: false, message: "The Owner has already accepted the invite and set a password." };
    return { ok: false, message: GENERIC_ERROR };
  }
}
