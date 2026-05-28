import { RequestTimeoutException } from '@nestjs/common';

/**
 * Options for translating a timeout error.
 */
interface RequestTimeoutOptions {
  /**
   * User-facing timeout message.
   */
  message: string;

  /**
   * Optional operation context (e.g., 'database query', 'external API call').
   */
  context?: string;
}

/**
 * Throws RequestTimeoutException when a timeout error is detected.
 * Handles common timeout patterns from TypeORM, Axios, and other libraries.
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
  throw new RequestTimeoutException(
    `${options.message}${contextSuffix}`,
  );
}
