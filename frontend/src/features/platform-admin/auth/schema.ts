import { z } from "zod";

// Admin sign-in, checked in the form and again in the Server Action. Matches
// the API (AdminLoginDto); sign-in doesn't re-check password rules.
export const adminSignInSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email("Enter a valid email address.").max(254, "Enter a valid email address.")),
  password: z.string().min(1, "Enter your password.").max(128, "Email or password is incorrect."),
});

export type AdminSignInState = {
  message?: string;
  fieldErrors?: Partial<Record<"email" | "password", string>>;
  email?: string;
};
