"use server";

import { HONEYPOT_FIELD } from "./config";
import type { ContactFormState } from "./form-state";
import { contactSchema, fieldErrorsFrom } from "./schema";

const FIELDS = ["name", "email", "subject", "message"];

export async function sendContactMessage(_previous: ContactFormState, formData: FormData): Promise<ContactFormState> {
  const values = Object.fromEntries(FIELDS.map((name) => [name, String(formData.get(name) ?? "")]));

  // Pretend success so bots learn nothing.
  if (String(formData.get(HONEYPOT_FIELD) ?? "") !== "") return { sent: true };

  const parsed = contactSchema.safeParse(values);
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error), values };

  // TEMPORARY: the backend has no contact endpoint yet. Replace with
  //   await apiFetch("/v1/contact", { method: "POST", body: parsed.data });
  // and map ApiError (429, fieldErrors) onto the form like guest-auth does.
  void parsed.data;
  return { sent: true };
}
