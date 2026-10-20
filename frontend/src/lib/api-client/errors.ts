// The API's single error shape (see docs/backend-architecture.md).
// fieldErrors maps a form field name to its message.
export type ApiError = {
  status: number;
  code: string;
  message: string;
  fieldErrors: Record<string, string>;
};

export function apiError(status: number, code: string, message: string, fieldErrors: Record<string, string> = {}): ApiError {
  return { status, code, message, fieldErrors };
}
