import { ConflictException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

/**
 * Options for translating a database unique-constraint error.
 */
interface UniqueConstraintOptions {
  /**
   * User-facing conflict message returned in the 409 response body.
   */
  message: string;

  /**
   * Optional Postgres constraint name to match.
   * When provided, the exception is only thrown if this specific constraint was violated.
   * Useful when a table has multiple unique constraints.
   */
  constraint?: string;
}

/**
 * Translates a Postgres unique constraint violation (error code 23505) into a 409 Conflict exception.
 * Has no effect on any other error type.
 *
 * @param error - The caught error to inspect.
 * @param options - Message and optional constraint name for precise matching.
 * @throws {ConflictException} When a unique constraint violation matching the options is detected.
 *
 * @example
 * try {
 *   await this.postRepository.save(post);
 * } catch (error) {
 *   throwIfUniqueConstraintViolation(error, {
 *     message: 'Post with this slug already exists',
 *     constraint: 'UQ_post_slug',
 *   });
 *   throw error;
 * }
 */
export function throwIfUniqueConstraintViolation(
  error: unknown,
  options: UniqueConstraintOptions,
): void {
  if (!(error instanceof QueryFailedError)) {
    return;
  }

  const driverError = error.driverError as {
    code?: string;
    constraint?: string;
  };

  if (driverError.code !== '23505') {
    return;
  }

  if (options.constraint && driverError.constraint !== options.constraint) {
    return;
  }

  throw new ConflictException(options.message);
}
