import { InternalServerErrorException, Logger } from '@nestjs/common';

/**
 * Options for internal server error exceptions.
 */
interface InternalServerErrorOptions {
  /**
   * Generic message returned to the client in the 500 response body.
   * Must not expose internal details such as stack traces or DB messages.
   */
  userMessage: string;

  /**
   * Detailed message written to the server log (never sent to the client).
   * Defaults to the original error's message when omitted.
   */
  internalMessage?: string;

  /**
   * Short tag identifying the operation that failed (e.g., 'user-creation', 'post-update').
   * Included in the log line for easier filtering.
   */
  context?: string;

  /**
   * Original error reference used to extract the stack trace for logging.
   */
  originalError?: unknown;
}

/** Shared NestJS logger instance used by all error-handler helpers in this module. */
const logger = new Logger('ErrorHandler');

/**
 * Translates any non-HTTP error into a 500 Internal Server Error exception.
 * Logs the full error details server-side via NestJS Logger while returning only
 * a generic message to the client.
 *
 * Known HTTP exceptions (those with a numeric `status` property) are detected
 * and silently skipped so they propagate unchanged.
 *
 * @param error - The caught error to inspect.
 * @param options - Generic client message, optional log message, context tag, and original error reference.
 * @throws {InternalServerErrorException} When the error is not a known HTTP exception.
 *
 * @example
 * try {
 *   await this.userRepository.save(user);
 * } catch (error) {
 *   throwIfUnexpectedError(error, {
 *     userMessage: 'Failed to create user',
 *     context: 'user-creation',
 *     originalError: error,
 *   });
 *   throw error;
 * }
 */
export function throwIfUnexpectedError(
  error: unknown,
  options: InternalServerErrorOptions,
): void {
  if (!error) {
    return;
  }

  // Skip if it's already an HttpException (400, 401, 403, 404, 409, etc.)
  const errorObj = error as Record<string, unknown>;
  if (errorObj.status && typeof errorObj.status === 'number') {
    // This is already an HTTP exception, don't convert it
    return;
  }

  // Log the detailed error for server-side debugging
  const contextInfo = options.context ? ` [${options.context}]` : '';
  const internalMsg = options.internalMessage || String(errorObj.message || 'Unknown error');
  
  logger.error(
    `${options.userMessage}${contextInfo}: ${internalMsg}`,
    errorObj instanceof Error ? errorObj.stack : '',
  );

  // Throw generic message to client
  throw new InternalServerErrorException(options.userMessage);
}

/**
 * Wraps an async operation with automatic error handling for unexpected exceptions.
 * Known HTTP exceptions are re-thrown as-is; all other errors are logged and
 * converted to a 500 Internal Server Error.
 *
 * @param operation - The async function to execute and guard.
 * @param options - Generic client message and logging options passed to `throwIfUnexpectedError`.
 * @returns The resolved value of the operation when it succeeds.
 * @throws {InternalServerErrorException} When an unexpected error occurs inside the operation.
 *
 * @example
 * return handleAsyncError(
 *   () => this.userRepository.find(),
 *   { userMessage: 'Failed to fetch users', context: 'user-fetch-all' },
 * );
 */
export async function handleAsyncError<T>(
  operation: () => Promise<T>,
  options: InternalServerErrorOptions,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    // Let known HTTP exceptions pass through
    const errorObj = error as Record<string, unknown>;
    if (errorObj.status && typeof errorObj.status === 'number') {
      throw error;
    }

    throwIfUnexpectedError(error, options);
    // This line is unreachable but satisfies TypeScript
    throw error;
  }
}

/**
 * Logs the error to the server via NestJS Logger and immediately re-throws it unchanged.
 * Use this when you need guaranteed logging but want to preserve the original exception type.
 *
 * @param error - The error to log and re-throw.
 * @param context - Short label identifying where the error occurred, included in the log line.
 * @returns Never — always throws.
 * @throws The original error unchanged.
 */
export function logAndRethrow(
  error: unknown,
  context: string,
): never {
  const errorObj = error as Record<string, unknown>;
  const message = String(errorObj.message || 'Unknown error');
  
  logger.error(
    `${context}: ${message}`,
    errorObj instanceof Error ? errorObj.stack : '',
  );

  throw error;
}
