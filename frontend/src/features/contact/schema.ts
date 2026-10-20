import { z } from "zod";

export const CONTACT_SUBJECTS = ["General Inquiry", "Support", "Sales", "Feedback", "Other"] as const;

export const MESSAGE_MIN = 10;
export const MESSAGE_MAX = 2000;

// One set of rules for the form (client) and the Server Action.
export const contactSchema = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(120, "Use at most 120 characters."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email("Enter a valid email address.").max(254, "Enter a valid email address.")),
  subject: z.enum(CONTACT_SUBJECTS, { error: "Choose a subject." }),
  message: z
    .string()
    .trim()
    .min(MESSAGE_MIN, `Tell us a little more (at least ${MESSAGE_MIN} characters).`)
    .max(MESSAGE_MAX, `Use at most ${MESSAGE_MAX} characters.`),
});

export type ContactMessage = z.infer<typeof contactSchema>;

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
