import { z } from "zod";

// One set of rules for the forms (client) and the Server Actions, matching the
// API (backend staff-auth DTOs). The API still validates everything again.
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;

export const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export const portalSchema = z.enum(["owner", "staff"]);

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

// Sign-in doesn't re-check password rules; older passwords may predate them.
export const signInSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password.").max(PASSWORD_MAX, "Email or password is incorrect."),
  rememberMe: checked,
});

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z.object({
  token: z.string().regex(TOKEN_PATTERN, "This link is invalid or has expired."),
  newPassword,
});

export const acceptInviteSchema = z.object({
  token: z.string().regex(TOKEN_PATTERN, "This invite link is invalid or has expired."),
  password: newPassword,
  rememberMe: checked,
});
