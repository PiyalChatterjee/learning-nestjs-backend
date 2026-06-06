import { BadRequestException } from '@nestjs/common';

/**
 * Represents a single validation error produced by class-validator.
 */
interface ValidationError {
  /** The DTO property name that failed validation. */
  property: string;
  /** Map of constraint names to their violation messages. */
  constraints?: Record<string, string>;
  /** Nested validation errors for complex/nested objects. */
  children?: ValidationError[];
}

/**
 * Options for translating validation errors.
 */
interface BadRequestOptions {
  /**
   * Fallback message used when no field-specific override matches.
   */
  defaultMessage: string;

  /**
   * Field-specific messages keyed by the DTO property name.
   * Overrides the first constraint message for matching fields.
   *
   * @example { email: 'Email format is invalid', password: 'Password is too weak' }
   */
  fieldMessages?: Record<string, string>;
}

/**
 * Translates a class-validator error array or a message-pattern match into a 400 Bad Request exception.
 * Has no effect on errors that do not match known validation patterns.
 *
 * @param error - The caught error to inspect. Can be a ValidationError array or any error object.
 * @param options - Default message and optional per-field message overrides.
 * @throws {BadRequestException} When a validation error pattern is detected.
 */
export function throwIfValidationError(
  error: unknown,
  options: BadRequestOptions,
): void {
  if (!error) {
    return;
  }

  // Check for class-validator ValidationError array
  if (Array.isArray(error)) {
    const firstError = error[0] as ValidationError | undefined;
    if (firstError?.property && firstError?.constraints) {
      const fieldMessage =
        options.fieldMessages?.[firstError.property] ||
        Object.values(firstError.constraints)[0] ||
        options.defaultMessage;

      throw new BadRequestException(fieldMessage);
    }
  }

  const errorObj = error as Record<string, unknown>;
  const message = String(errorObj.message || '').toLowerCase();

  // Check for common validation patterns
  const isValidationError =
    message.includes('invalid') ||
    message.includes('must be') ||
    message.includes('should be') ||
    message.includes('not valid') ||
    message.includes('validation failed') ||
    message.includes('constraint') ||
    message.includes('format') ||
    message.includes('strength') ||
    message.includes('length');

  if (!isValidationError) {
    return;
  }

  throw new BadRequestException(options.defaultMessage);
}

/**
 * Validates that the given string is a well-formed email address.
 *
 * @param email - The email string to validate.
 * @throws {BadRequestException} When the email does not match the expected format.
 */
export function validateEmail(email: string): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new BadRequestException('Invalid email format');
  }
}

/**
 * Validates password strength against the application's password policy:
 * - Minimum 8 characters, maximum 64 characters.
 * - At least one uppercase letter (A–Z).
 * - At least one lowercase letter (a–z).
 * - At least one digit (0–9).
 * - At least one special character (non-alphanumeric).
 *
 * @param password - The plain-text password string to validate.
 * @throws {BadRequestException} On the first policy rule that is violated.
 */
export function validatePasswordStrength(password: string): void {
  if (!password || password.length < 8) {
    throw new BadRequestException(
      'Password must be at least 8 characters long',
    );
  }

  if (password.length > 64) {
    throw new BadRequestException('Password must not exceed 64 characters');
  }

  if (!/[A-Z]/.test(password)) {
    throw new BadRequestException(
      'Password must contain at least one uppercase letter',
    );
  }

  if (!/[a-z]/.test(password)) {
    throw new BadRequestException(
      'Password must contain at least one lowercase letter',
    );
  }

  if (!/\d/.test(password)) {
    throw new BadRequestException('Password must contain at least one number');
  }

  if (!/[\W_]/.test(password)) {
    throw new BadRequestException(
      'Password must contain at least one special character',
    );
  }
}

/**
 * Validates that a string field satisfies minimum and/or maximum length constraints.
 *
 * @param value - The string value to validate.
 * @param fieldName - Human-readable field label used in error messages.
 * @param minLength - Optional minimum allowed length (inclusive).
 * @param maxLength - Optional maximum allowed length (inclusive).
 * @throws {BadRequestException} When the value violates a length constraint.
 */
export function validateFieldLength(
  value: string,
  fieldName: string,
  minLength?: number,
  maxLength?: number,
): void {
  if (minLength && value.length < minLength) {
    throw new BadRequestException(
      `${fieldName} must be at least ${minLength} characters long`,
    );
  }

  if (maxLength && value.length > maxLength) {
    throw new BadRequestException(
      `${fieldName} must not exceed ${maxLength} characters`,
    );
  }
}

/**
 * Validates that a required field is present and non-empty.
 *
 * @param value - The value to check.
 * @param fieldName - Human-readable field label used in error messages.
 * @throws {BadRequestException} When the value is null, undefined, or an empty string.
 */
export function validateRequired(value: unknown, fieldName: string): void {
  if (value === null || value === undefined || value === '') {
    throw new BadRequestException(`${fieldName} is required`);
  }
}
