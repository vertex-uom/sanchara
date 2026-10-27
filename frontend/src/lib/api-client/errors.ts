// The API's single error shape (see docs/backend-architecture.md).
// fieldErrors maps a form field name to its message.
export type ApiError = {
  status: number;
  code: string;
  message: string;
  fieldErrors: Record<string, string>;
};

export function isApiError(value: unknown): value is ApiError {
  return typeof value === "object" && value !== null && "status" in value && "code" in value && "message" in value;
}

// Anything thrown by an API client, as an ApiError (network failures included).
export function toApiError(value: unknown): ApiError {
  if (isApiError(value)) return value;
  return { status: 0, code: "network_error", message: "Something went wrong. Try again.", fieldErrors: {} };
}

export function apiError(status: number, code: string, message: string, fieldErrors: Record<string, string> = {}): ApiError {
  return { status, code, message, fieldErrors };
}
