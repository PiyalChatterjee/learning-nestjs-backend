import { BadRequestException } from '@nestjs/common';

/**
 * Validation error from class-validator
 */
interface ValidationError {
  property: string;
  constraints?: Record<string, string>;
  children?: ValidationError[];
}

/**
 * Options for translating validation errors.
 */
interface BadRequestOptions {
  /**
   * Default message if no specific validation error is found.
   */
  defaultMessage: string;

  /**
   * Optional field-specific error messages to override defaults.
   * Example: { email: 'Email format is invalid', password: 'Password is too weak' }
   */
  fieldMessages?: Record<string, string>;
}

/**
 * Throws BadRequestException when class-validator errors or validation patterns are detected.
 * Handles common validation scenarios: email format, password strength, field length, etc.
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
 * Validates email format and throws BadRequestException if invalid.
 */
export function validateEmail(email: string): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new BadRequestException('Invalid email format');
  }
}

/**
 * Validates password strength according to policy:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
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
    throw new BadRequestException(
      'Password must contain at least one number',
    );
  }

  if (!/[\W_]/.test(password)) {
    throw new BadRequestException(
      'Password must contain at least one special character',
    );
  }
}

/**
 * Validates string field length and throws BadRequestException if invalid.
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
 * Validates that a required field is not empty.
 */
export function validateRequired(
  value: unknown,
  fieldName: string,
): void {
  if (value === null || value === undefined || value === '') {
    throw new BadRequestException(`${fieldName} is required`);
  }
}
