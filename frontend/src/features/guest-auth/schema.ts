import { z } from "zod";

// One set of rules for the forms (client) and the Server Actions, matching the
// API (backend guest-auth DTOs). The API still validates everything again.
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;

const E164 = /^\+[1-9]\d{7,14}$/;

const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Enter a valid email address.").max(254, "Enter a valid email address."));

const newPassword = z
  .string()
  .min(PASSWORD_MIN, `Use at least ${PASSWORD_MIN} characters.`)
  .max(PASSWORD_MAX, `Use at most ${PASSWORD_MAX} characters.`);

// Checkboxes post "on" when ticked and nothing otherwise.
const checked = z.preprocess((value) => value === "on" || value === true, z.boolean());

export const signUpSchema = z
  .object({
    fullName: z.string().trim().min(1, "Enter your full name.").max(120, "Use at most 120 characters."),
    email,
    // Optional; spaces, dashes and brackets are dropped before the E.164 check.
    mobile: z
      .string()
      .transform((value) => value.replace(/[\s()-]/g, ""))
      .refine((value) => value === "" || E164.test(value), "Enter the number with country code, e.g. +94 77 123 4567.")
      .optional(),
    password: newPassword,
    terms: checked.refine((value) => value, "Please accept the Terms and Privacy Policy."),
  })
  .refine((data) => data.password.trim().toLowerCase() !== data.email, {
    path: ["password"],
    message: "Your password can't be your email address.",
  });

// Sign-in doesn't re-check password rules; older passwords may predate them.
export const signInSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password.").max(PASSWORD_MAX, "Email or password is incorrect."),
  rememberMe: checked,
});

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z.object({
  token: z.string().regex(/^[A-Za-z0-9_-]{43}$/, "This link is invalid or has expired."),
  newPassword,
});

export type FieldErrors = Partial<Record<string, string>>;

// First message per field, keyed by field name.
export function fieldErrorsFrom(error: z.ZodError): FieldErrors {
  const result: FieldErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    result[key] ??= issue.message;
  }
  return result;
}
