"use server";

import { redirect } from "next/navigation";
import { ApiError, apiFetch } from "@/lib/api-client/server";
import { signInPath, type StaffPortal } from "@/lib/auth/staff";
import { setStaffGoogleState, setStaffSession } from "@/lib/auth/staff-session";
import { fieldErrorsFrom } from "@/lib/forms/field-errors";
import type { StaffAuthFormState } from "./form-state";
import { PORTAL_COPY } from "./portal-copy";
import { acceptInviteSchema, forgotPasswordSchema, portalSchema, resetPasswordSchema, signInSchema } from "./schema";

type SessionResponse = { session: { token: string; rememberMe: boolean }; portal: StaffPortal };

const GENERIC_ERROR = "Something went wrong. Please try again.";

// Every form posts the portal it was shown on.
function portalFrom(formData: FormData): StaffPortal {
  const parsed = portalSchema.safeParse(formData.get("portal"));
  return parsed.success ? parsed.data : "staff";
}

// Text fields to put back in the form after an error. Never the password.
function keep(formData: FormData, names: string[]): Record<string, string> {
  return Object.fromEntries(names.map((name) => [name, String(formData.get(name) ?? "")]));
}

function waitMessage(seconds: number | null) {
  const minutes = Math.max(1, Math.ceil((seconds ?? 60) / 60));
  return `Too many attempts. Please try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`;
}

// API errors → what the form shows. Sign-in failures stay generic, so the page
// never reveals whether an email has an account or belongs to the other portal.
function toFormState(error: unknown, values: Record<string, string>, portal: StaffPortal): StaffAuthFormState {
  if (!(error instanceof ApiError)) throw error;
  if (error.status === 429) return { message: waitMessage(error.retryAfter), values };
  if (error.code === "INVALID_CREDENTIALS") return { message: "Email or password is incorrect.", values };
  if (error.code === "INVITE_INVALID") {
    return { message: `This invite link is invalid or has expired. Ask ${PORTAL_COPY[portal].newInviteFrom} to send a new one.`, values };
  }
  if (error.code === "RESET_TOKEN_INVALID") {
    return { message: "This reset link is invalid or has expired. Request a new one.", values };
  }
  if (error.status === 400 && Object.keys(error.fieldErrors).length > 0) {
    const fieldErrors = Object.fromEntries(Object.entries(error.fieldErrors).map(([key, messages]) => [key, messages[0]]));
    return { fieldErrors, values };
  }
  return { message: GENERIC_ERROR, values };
}

// The Back Office home decides where each role lands.
export async function signInStaff(_previous: StaffAuthFormState, formData: FormData): Promise<StaffAuthFormState> {
  const portal = portalFrom(formData);
  const values = keep(formData, ["email"]);
  const parsed = signInSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error), values };

  try {
    const result = await apiFetch<SessionResponse>("/v1/auth/staff/login", { method: "POST", body: { ...parsed.data, portal } });
    await setStaffSession(result.session.token, result.session.rememberMe, result.portal);
  } catch (error) {
    return toFormState(error, values, portal);
  }
  redirect("/");
}

// Sends the browser to Google; /sign-in/google/callback finishes the sign-in.
export async function startStaffGoogleSignIn(formData: FormData): Promise<void> {
  const portal = portalFrom(formData);
  let authorizationUrl: string;
  try {
    const result = await apiFetch<{ authorizationUrl: string; state: string }>("/v1/auth/staff/google/start", {
      method: "POST",
      body: { portal },
    });
    await setStaffGoogleState(result.state, portal);
    authorizationUrl = result.authorizationUrl;
  } catch {
    redirect(`${signInPath(portal)}?error=google`);
  }
  redirect(authorizationUrl);
}

// Always the same confirmation, whether or not the email has an account here.
export async function requestStaffPasswordReset(_previous: StaffAuthFormState, formData: FormData): Promise<StaffAuthFormState> {
  const portal = portalFrom(formData);
  const values = keep(formData, ["email"]);
  const parsed = forgotPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error), values };

  try {
    await apiFetch("/v1/auth/staff/password/forgot", { method: "POST", body: { ...parsed.data, portal } });
  } catch (error) {
    return toFormState(error, values, portal);
  }
  return { sent: true, values };
}

export async function resetStaffPassword(_previous: StaffAuthFormState, formData: FormData): Promise<StaffAuthFormState> {
  const portal = portalFrom(formData);
  const parsed = resetPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  try {
    await apiFetch("/v1/auth/staff/password/reset", { method: "POST", body: parsed.data });
  } catch (error) {
    return toFormState(error, {}, portal);
  }
  redirect(`${signInPath(portal)}?reset=1`);
}

// Sets the password, activates the account and signs in.
export async function acceptStaffInvite(_previous: StaffAuthFormState, formData: FormData): Promise<StaffAuthFormState> {
  const portal = portalFrom(formData);
  const parsed = acceptInviteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  try {
    const result = await apiFetch<SessionResponse>("/v1/auth/staff/invite/accept", { method: "POST", body: { ...parsed.data, portal } });
    await setStaffSession(result.session.token, result.session.rememberMe, result.portal);
  } catch (error) {
    return toFormState(error, {}, portal);
  }
  redirect("/");
}
