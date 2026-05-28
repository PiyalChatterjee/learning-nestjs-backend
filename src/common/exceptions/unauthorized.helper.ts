import { UnauthorizedException } from '@nestjs/common';

/**
 * Options for unauthorized exceptions.
 */
interface UnauthorizedOptions {
  /**
   * User-facing message returned in the 401 response body.
   */
  message: string;

  /**
   * Optional description of the authentication step that failed (e.g., 'JWT validation', 'credential verification').
   * Appended to the message in parentheses when provided.
   */
  context?: string;
}

/**
 * Translates an authentication-related error into a 401 Unauthorized exception.
 * Detects JWT errors, expired/invalid tokens, and failed credential patterns.
 * Has no effect on errors that do not match auth patterns.
 *
 * Detected patterns:
 * - Error name: `JsonWebTokenError`, `TokenError`
 * - Message containing: 'invalid token', 'expired token', 'invalid signature', 'unauthorized', 'invalid credentials', 'authentication failed', 'jwt'
 *
 * @param error - The caught error to inspect.
 * @param options - User-facing message and optional authentication context.
 * @throws {UnauthorizedException} When an authentication failure pattern is detected.
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
 * Validates that an authentication token is present and non-empty.
 *
 * @param token - The token string to check.
 * @throws {UnauthorizedException} When the token is undefined, null, or blank.
 */
export function assertTokenExists(token: string | undefined): void {
  if (!token || token.trim() === '') {
    throw new UnauthorizedException('Authentication token is required');
  }
}

/**
 * Validates that the current user is authenticated.
 *
 * @param isAuthenticated - Boolean result from an authentication check.
 * @param context - Optional description of the operation being guarded.
 * @throws {UnauthorizedException} When isAuthenticated is false.
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
