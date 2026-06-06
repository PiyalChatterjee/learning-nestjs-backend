import { RequestTimeoutException } from '@nestjs/common';

/**
 * Options for translating a timeout error.
 */
interface RequestTimeoutOptions {
  /**
   * User-facing message returned in the 408 response body.
   */
  message: string;

  /**
   * Optional description of the operation that timed out (e.g., 'database query', 'external API call').
   * Appended to the message in parentheses when provided.
   */
  context?: string;
}

/**
 * Translates a timeout-related error into a 408 Request Timeout exception.
 * Detects common patterns from TypeORM, Axios, and Node.js networking.
 * Has no effect on errors that do not match timeout patterns.
 *
 * Detected patterns:
 * - `ECONNABORTED` — Axios request timeout
 * - `ETIMEDOUT` — Node.js network connection timeout
 * - `ESOCKETTIMEDOUT` — Node.js socket inactivity timeout
 * - Message containing 'timeout', 'timed out'
 * - Message containing 'deadlock detected' (TypeORM / Postgres)
 *
 * @param error - The caught error to inspect.
 * @param options - User-facing message and optional operation context.
 * @throws {RequestTimeoutException} When a timeout pattern is detected.
 *
 * @example
 * try {
 *   const users = await this.userRepository.find();
 * } catch (error) {
 *   throwIfRequestTimeout(error, {
 *     message: 'Failed to fetch users',
 *     context: 'database query',
 *   });
 *   throw error;
 * }
 */
export function throwIfRequestTimeout(
  error: unknown,
  options: RequestTimeoutOptions,
): void {
  if (!error) {
    return;
  }

  const errorObj = error as Record<string, unknown>;
  const errorMessage = String(errorObj.message || '').toLowerCase();
  const errorCode = String(errorObj.code || '').toLowerCase();

  // Check for common timeout patterns
  const isTimeout =
    errorCode === 'econnaborted' || // Axios timeout
    errorCode === 'etimedout' || // Network timeout
    errorCode === 'esockettimedout' || // Socket timeout
    errorMessage.includes('timeout') ||
    errorMessage.includes('timed out') ||
    errorMessage.includes('deadlock detected');

  if (!isTimeout) {
    return;
  }

  const contextSuffix = options.context ? ` (${options.context})` : '';
  throw new RequestTimeoutException(`${options.message}${contextSuffix}`);
}
