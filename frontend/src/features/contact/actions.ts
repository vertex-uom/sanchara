"use server";

import { ApiError, apiFetch } from "@/lib/api-client/server";
import { HONEYPOT_FIELD } from "./config";
import type { ContactFormState } from "./form-state";
import { contactSchema, fieldErrorsFrom } from "./schema";

const FIELDS = ["name", "email", "subject", "message"];

// "General Inquiry" → "general-inquiry", the API's subject key.
const subjectKey = (subject: string) => subject.toLowerCase().replaceAll(" ", "-");

function waitMessage(seconds: number | null) {
  const minutes = Math.max(1, Math.ceil((seconds ?? 60) / 60));
  return `You've sent several messages already. Please try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`;
}

export async function sendContactMessage(_previous: ContactFormState, formData: FormData): Promise<ContactFormState> {
  const values = Object.fromEntries(FIELDS.map((name) => [name, String(formData.get(name) ?? "")]));

  // Pretend success so bots learn nothing.
  if (String(formData.get(HONEYPOT_FIELD) ?? "") !== "") return { sent: true };

  const parsed = contactSchema.safeParse(values);
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error), values };

  try {
    await apiFetch("/v1/contact", { method: "POST", body: { ...parsed.data, subject: subjectKey(parsed.data.subject) } });
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    if (error.status === 429) return { message: waitMessage(error.retryAfter), values };
    if (error.status === 400 && Object.keys(error.fieldErrors).length > 0) {
      return { fieldErrors: Object.fromEntries(Object.entries(error.fieldErrors).map(([field, messages]) => [field, messages[0]])), values };
    }
    return { message: "Your message couldn't be sent. Please try again.", values };
  }
  return { sent: true };
}
