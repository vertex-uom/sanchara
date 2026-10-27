import { HttpStatus } from '@nestjs/common';
import { AppException } from '../../../common/errors/app-exception.js';
import { normaliseEmail } from '../../../common/validation/normalise.js';

// Throws a field error on `field` when the password is just the (normalised) email.
export function assertPasswordNotEmail(password: string, email: string, field: string): void {
  if (normaliseEmail(password) !== email) return;
  throw new AppException(HttpStatus.BAD_REQUEST, 'VALIDATION_FAILED', 'Some fields are invalid.', {
    [field]: ['Password must not be the same as your email.'],
  });
}
