import { InternalServerErrorException, Logger } from '@nestjs/common';

/**
 * Options for internal server error exceptions.
 */
interface InternalServerErrorOptions {
  /**
   * User-facing error message (generic, doesn't expose internals).
   */
  userMessage: string;

  /**
   * Detailed error message for logging (internal use only).
   */
  internalMessage?: string;

  /**
   * Error context for better logging (e.g., 'user-creation', 'post-update').
   */
  context?: string;

  /**
   * Original error for logging stack trace.
   */
  originalError?: unknown;
}

const logger = new Logger('ErrorHandler');

/**
 * Throws InternalServerErrorException for unexpected errors.
 * Logs detailed error information server-side while returning generic message to client.
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
 * Safely wraps async operations and throws InternalServerErrorException on unexpected errors.
 * Automatically logs errors and returns generic response to client.
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
 * Logs error for monitoring while preserving original exception type.
 * Use when you want to preserve the error but ensure it's logged.
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
