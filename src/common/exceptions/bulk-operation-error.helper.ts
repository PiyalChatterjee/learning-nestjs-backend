import { throwIfServiceUnavailable } from './service-unavailable.helper';
import { throwIfRequestTimeout } from './request-timeout.helper';
import { throwIfUnexpectedError } from './internal-error.helper';

/**
 * Options for handling bulk operation errors (e.g., batch create, bulk update).
 */
interface BulkOperationErrorOptions {
  /**
   * User-facing message to include in the error response.
   */
  userMessage: string;

  /**
   * Context describing the bulk operation for logging and debugging.
   * Example: 'users-batch-creation', 'posts-bulk-update'
   */
  context: string;

  /**
   * Optional service name for ServiceUnavailable errors.
   * Defaults to 'database'.
   */
  serviceName?: string;
}

/**
 * Handles errors from bulk database operations using a cascading check strategy.
 * Attempts to match the error against known patterns in order:
 * 1. Service unavailability (DB down, connection failure)
 * 2. Request timeout (slow query, network delay)
 * 3. Unexpected errors (all other failures)
 *
 * If no pattern matches, rethrows the original error.
 * This helper is designed to work alongside transaction rollback in bulk operation providers.
 *
 * @param error - The caught error to inspect and translate.
 * @param options - Configuration for the error response and logging context.
 * @throws {ServiceUnavailableException} if service/DB unavailable error is detected.
 * @throws {RequestTimeoutException} if timeout error is detected.
 * @throws {InternalServerErrorException} if any other error is caught.
 * @throws Original error if no pattern matches.
 *
 * @example
 * ```typescript
 * try {
 *   // bulk DB operation
 * } catch (error) {
 *   await queryRunner.rollbackTransaction();
 *   throwIfBulkOperationError(error, {
 *     userMessage: 'Failed to create users',
 *     context: 'users-batch-creation',
 *   });
 * }
 * ```
 */
export function throwIfBulkOperationError(
  error: unknown,
  options: BulkOperationErrorOptions,
): void {
  const serviceName = options.serviceName || 'database';

  throwIfServiceUnavailable(error, {
    message: options.userMessage,
    serviceName,
    shouldLog: true,
  });

  throwIfRequestTimeout(error, {
    message: options.userMessage,
    context: options.context,
  });

  throwIfUnexpectedError(error, {
    userMessage: options.userMessage,
    context: options.context,
    originalError: error,
  });

  throw error;
}
