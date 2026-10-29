import type { FieldErrors } from "@/lib/forms/field-errors";

// Result of a staff auth Server Action, read with useActionState.
// `values` re-fills text fields after an error (never the password).
export type StaffAuthFormState = {
  message?: string;
  fieldErrors?: FieldErrors;
  values?: Record<string, string>;
  // Forgot password: the "check your email" confirmation.
  sent?: boolean;
};

export const initialFormState: StaffAuthFormState = {};
