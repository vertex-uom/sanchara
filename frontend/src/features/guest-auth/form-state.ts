import type { FieldErrors } from "@/lib/forms/field-errors";

// Result of an auth Server Action, read with useActionState.
// `values` re-fills text fields after an error (never the password).
export type AuthFormState = {
  message?: string;
  fieldErrors?: FieldErrors;
  values?: Record<string, string>;
  // Forgot password: the "check your email" confirmation.
  sent?: boolean;
};

export const initialFormState: AuthFormState = {};
