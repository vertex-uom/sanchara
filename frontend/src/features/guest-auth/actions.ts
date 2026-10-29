"use server";

import { redirect } from "next/navigation";
import { ApiError, apiFetch } from "@/lib/api-client/server";
import { clearGuestSession, readGuestToken, setGoogleState, setGuestSession } from "@/lib/auth/guest-session";
import { safeReturnTo } from "@/lib/auth/return-to";
import type { AuthFormState } from "./form-state";
import { fieldErrorsFrom } from "@/lib/forms/field-errors";
import { forgotPasswordSchema, resetPasswordSchema, signInSchema, signUpSchema } from "./schema";

type SessionResponse = { session: { token: string; rememberMe: boolean } };

const GENERIC_ERROR = "Something went wrong. Please try again.";

// Text fields to put back in the form after an error. Never the password.
function keep(formData: FormData, names: string[]): Record<string, string> {
  return Object.fromEntries(names.map((name) => [name, String(formData.get(name) ?? "")]));
}

function waitMessage(seconds: number | null) {
  const minutes = Math.max(1, Math.ceil((seconds ?? 60) / 60));
  return `Too many attempts. Please try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`;
}

// API errors → what the form shows. Sign-in failures stay generic so the page
// never reveals whether an email has an account.
function toFormState(error: unknown, values: Record<string, string>): AuthFormState {
  if (!(error instanceof ApiError)) throw error;
  if (error.status === 429) return { message: waitMessage(error.retryAfter), values };
  if (error.code === "INVALID_CREDENTIALS") return { message: "Email or password is incorrect.", values };
  if (error.code === "EMAIL_TAKEN") {
    return { fieldErrors: { email: "An account with this email already exists. Try signing in instead." }, values };
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

function destination(formData: FormData) {
  return safeReturnTo(formData.get("returnTo")) ?? "/";
}

export async function signUp(_previous: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const values = keep(formData, ["fullName", "email", "mobile"]);
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error), values };

  const { fullName, email, mobile, password } = parsed.data;
  try {
    const { session } = await apiFetch<SessionResponse>("/v1/auth/guest/register", {
      method: "POST",
      body: { fullName, email, password, ...(mobile ? { mobile } : {}) },
    });
    await setGuestSession(session.token, false);
  } catch (error) {
    return toFormState(error, values);
  }
  redirect(destination(formData));
}

export async function signIn(_previous: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const values = keep(formData, ["email"]);
  const parsed = signInSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error), values };

  try {
    const { session } = await apiFetch<SessionResponse>("/v1/auth/guest/login", { method: "POST", body: parsed.data });
    await setGuestSession(session.token, session.rememberMe);
  } catch (error) {
    return toFormState(error, values);
  }
  redirect(destination(formData));
}

// Starts Google sign-in; the API remembers where to return after the callback.
export async function startGoogleSignIn(formData: FormData): Promise<void> {
  let authorizationUrl: string;
  try {
    const result = await apiFetch<{ authorizationUrl: string; state: string }>("/v1/auth/guest/google/start", {
      method: "POST",
      body: { returnTo: destination(formData) },
    });
    await setGoogleState(result.state);
    authorizationUrl = result.authorizationUrl;
  } catch {
    redirect("/sign-in?error=google");
  }
  redirect(authorizationUrl);
}

// Always the same confirmation, whether or not the email has an account.
export async function requestPasswordReset(_previous: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const values = keep(formData, ["email"]);
  const parsed = forgotPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error), values };

  try {
    await apiFetch("/v1/auth/guest/password/forgot", { method: "POST", body: parsed.data });
  } catch (error) {
    return toFormState(error, values);
  }
  return { sent: true, values };
}

export async function resetPassword(_previous: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = resetPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  try {
    await apiFetch("/v1/auth/guest/password/reset", { method: "POST", body: parsed.data });
  } catch (error) {
    return toFormState(error, {});
  }
  redirect("/sign-in?reset=1");
}

// Ends the session on the server, then forgets the cookie.
export async function signOut(): Promise<void> {
  const token = await readGuestToken();
  if (token) {
    await apiFetch("/v1/auth/guest/logout", { method: "POST", token }).catch(() => undefined);
  }
  await clearGuestSession();
  redirect("/");
}
