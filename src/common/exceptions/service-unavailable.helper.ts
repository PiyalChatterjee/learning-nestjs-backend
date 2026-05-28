import { ServiceUnavailableException } from '@nestjs/common';

/**
 * Options for service unavailable exceptions.
 */
interface ServiceUnavailableOptions {
  /**
   * User-facing error message.
   */
  message: string;

  /**
   * Optional service name or context that is unavailable.
   */
  serviceName?: string;

  /**
   * Optional flag to enable error logging for monitoring.
   */
  shouldLog?: boolean;
}

/**
 * Throws ServiceUnavailableException when external services/database are down.
 * Handles: connection failures, timeout to services, database unavailability.
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
 * Validates database connection is available and throws ServiceUnavailableException if not.
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
 * Validates external service is reachable and throws ServiceUnavailableException if not.
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
