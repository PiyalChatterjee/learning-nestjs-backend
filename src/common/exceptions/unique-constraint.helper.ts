import { ConflictException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

/**
 * Options for translating a database unique-constraint error.
 */
interface UniqueConstraintOptions {
  /**
   * User-facing conflict message.
   */
  message: string;

  /**
   * Optional database constraint name to match exactly.
   */
  constraint?: string;
}

/**
 * Throws ConflictException when a Postgres unique constraint error is detected.
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