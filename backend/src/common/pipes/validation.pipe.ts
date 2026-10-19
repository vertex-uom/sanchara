import { HttpStatus, ValidationPipe, type ValidationError } from '@nestjs/common';
import { AppException, type FieldErrors } from '../errors/app-exception.js';

// Flattens nested errors to dotted paths, e.g. { "address.city": ["..."] }.
function toFieldErrors(errors: ValidationError[], parent = ''): FieldErrors {
  const result: FieldErrors = {};
  for (const error of errors) {
    const path = parent ? `${parent}.${error.property}` : error.property;
    if (error.constraints) result[path] = Object.values(error.constraints);
    if (error.children?.length) Object.assign(result, toFieldErrors(error.children, path));
  }
  return result;
}

// Strips unknown fields, rejects them loudly, and converts payloads to DTO instances.
export function createValidationPipe() {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    // Never echo submitted values (could be a password) back in messages.
    validationError: { target: false, value: false },
    exceptionFactory: (errors) =>
      new AppException(HttpStatus.BAD_REQUEST, 'VALIDATION_FAILED', 'Some fields are invalid.', toFieldErrors(errors)),
  });
}
