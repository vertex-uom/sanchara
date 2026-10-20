import { HttpException, HttpStatus } from '@nestjs/common';

export type FieldErrors = Record<string, string[]>;

// The one error body the API returns.
export type ErrorBody = {
  status: number;
  code: string;
  message: string;
  fieldErrors?: FieldErrors;
};

// Throw this for expected failures; `code` is stable and safe for clients to branch on.
export class AppException extends HttpException {
  constructor(
    status: HttpStatus,
    readonly code: string,
    message: string,
    readonly fieldErrors?: FieldErrors,
    // Extra response headers, e.g. Retry-After on 429.
    readonly headers?: Record<string, string>,
  ) {
    super(message, status);
  }
}
