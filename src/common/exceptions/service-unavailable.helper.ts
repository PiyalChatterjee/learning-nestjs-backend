import { ServiceUnavailableException } from '@nestjs/common';

/**
 * Options for service unavailable exceptions.
 */
interface ServiceUnavailableOptions {
  /**
   * User-facing message returned in the 503 response body.
   */
  message: string;

  /**
   * Optional name of the service or resource that is unavailable (e.g., 'database', 'payment-service').
   * Appended to the message in parentheses when provided.
   */
  serviceName?: string;

  /**
   * When true, logs the error to stderr via console.error for monitoring.
   * Should be enabled in production service layers.
   */
  shouldLog?: boolean;
}

/**
 * Translates a connectivity or service-down error into a 503 Service Unavailable exception.
 * Has no effect on errors that do not match connectivity patterns.
 *
 * Detected patterns:
 * - `ECONNREFUSED` — TCP connection refused (DB/service not running)
 * - `EHOSTUNREACH` — Host unreachable (network partition)
 * - `ENETUNREACH` — Network unreachable
 * - `ENOTFOUND` — DNS resolution failure
 * - Message containing: 'connection refused', 'unable to connect', 'connection timeout', 'service unavailable', 'database unavailable', 'pool exhausted'
 *
 * @param error - The caught error to inspect.
 * @param options - User-facing message, optional service name, and logging flag.
 * @throws {ServiceUnavailableException} When a connectivity failure pattern is detected.
 *
 * @example
 * try {
 *   await this.userRepository.find();
 * } catch (error) {
 *   throwIfServiceUnavailable(error, {
 *     message: 'Cannot fetch users at this moment',
 *     serviceName: 'database',
 *     shouldLog: true,
 *   });
 *   throw error;
 * }
 */
export function throwIfServiceUnavailable(
  error: unknown,
  options: ServiceUnavailableOptions,
): void {
  if (!error) {
    return;
  }

  const errorObj = error as Record<string, unknown>;
  const message = String(errorObj.message || '').toLowerCase();
  const errorCode = String(errorObj.code || '').toLowerCase();

  // Check for common service unavailability patterns
  const isUnavailable =
    errorCode === 'econnrefused' || // Connection refused
    errorCode === 'ehostunreach' || // Host unreachable
    errorCode === 'enetunreach' || // Network unreachable
    errorCode === 'enotfound' || // DNS resolution failed
    message.includes('connection refused') ||
    message.includes('connect econnrefused') ||
    message.includes('getaddrinfo enotfound') ||
    message.includes('unable to connect') ||
    message.includes('connection timeout') ||
    message.includes('service unavailable') ||
    message.includes('database unavailable') ||
    message.includes('datasource is not initialized') ||
    message.includes('data source is not initialized') ||
    message.includes('driver not connected') ||
    message.includes('no metadata for') ||
    message.includes('entitymetadatanotfounderror') ||
    message.includes('pool exhausted');

  if (!isUnavailable) {
    return;
  }

  if (options.shouldLog) {
    console.error(
      `[ServiceUnavailable] ${options.serviceName || 'Service'}: ${message}`,
    );
  }

  const serviceSuffix = options.serviceName ? ` (${options.serviceName})` : '';
  throw new ServiceUnavailableException(
    `${options.message}${serviceSuffix}. Please try again later.`,
  );
}

/**
 * Validates that the database connection is active.
 *
 * @param isConnected - Boolean result from a connectivity check.
 * @throws {ServiceUnavailableException} When isConnected is false.
 */
export function assertDatabaseAvailable(
  isConnected: boolean,
): void {
  if (!isConnected) {
    throw new ServiceUnavailableException(
      'Database service is currently unavailable. Please try again later.',
    );
  }
}

/**
 * Validates that an external service is reachable.
 *
 * @param isReachable - Boolean result from a reachability check.
 * @param serviceName - Human-readable name of the external service used in the error message.
 * @throws {ServiceUnavailableException} When isReachable is false.
 */
export function assertServiceReachable(
  isReachable: boolean,
  serviceName: string,
): void {
  if (!isReachable) {
    throw new ServiceUnavailableException(
      `${serviceName} is currently unavailable. Please try again later.`,
    );
  }
}
