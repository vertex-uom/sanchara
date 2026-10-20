import type { FieldErrors } from "./schema";

// Result of the contact Server Action, read with useActionState.
// `values` re-fills the fields after an error.
export type ContactFormState = {
  message?: string;
  fieldErrors?: FieldErrors;
  values?: Record<string, string>;
  sent?: boolean;
};

export const initialContactState: ContactFormState = {};
