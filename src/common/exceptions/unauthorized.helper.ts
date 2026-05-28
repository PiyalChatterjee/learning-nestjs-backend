import { UnauthorizedException } from '@nestjs/common';

/**
 * Options for unauthorized exceptions.
 */
interface UnauthorizedOptions {
  /**
   * User-facing error message.
   */
  message: string;

  /**
   * Optional context (e.g., 'JWT validation', 'credential verification').
   */
  context?: string;
}

/**
 * Throws UnauthorizedException when authentication fails.
 * Handles: missing tokens, invalid tokens, expired sessions, wrong credentials.
 */
export function throwIfUnauthorized(
  error: unknown,
  options: UnauthorizedOptions,
): void {
  if (!error) {
    return;
  }

  const errorObj = error as Record<string, unknown>;
  const message = String(errorObj.message || '').toLowerCase();
  const errorName = String(errorObj.name || '').toLowerCase();

  // Check for common auth error patterns
  const isAuthError =
    errorName === 'jsonwebtokenerror' ||
    errorName === 'tokenerror' ||
    message.includes('invalid token') ||
    message.includes('expired token') ||
    message.includes('invalid signature') ||
    message.includes('no token') ||
    message.includes('unauthorized') ||
    message.includes('invalid credentials') ||
    message.includes('authentication failed') ||
    message.includes('jwt');

  if (!isAuthError) {
    return;
  }

  const contextSuffix = options.context ? ` (${options.context})` : '';
  throw new UnauthorizedException(`${options.message}${contextSuffix}`);
}

/**
 * Validates that authentication token is provided and throws UnauthorizedException if missing.
 */
export function assertTokenExists(token: string | undefined): void {
  if (!token || token.trim() === '') {
    throw new UnauthorizedException('Authentication token is required');
  }
}

/**
 * Validates that user is authenticated and throws UnauthorizedException if not.
 */
export function assertUserAuthenticated(
  isAuthenticated: boolean,
  context?: string,
): void {
  if (!isAuthenticated) {
    const message = 'User is not authenticated';
    const contextSuffix = context ? ` (${context})` : '';
    throw new UnauthorizedException(`${message}${contextSuffix}`);
  }
}
