import { ForbiddenException } from '@nestjs/common';

/**
 * Options for forbidden exceptions.
 */
interface ForbiddenOptions {
  /**
   * User-facing message returned in the 403 response body.
   */
  message: string;

  /**
   * Optional description of the permission check that failed (e.g., 'insufficient role', 'resource ownership').
   * Appended to the message in parentheses when provided.
   */
  context?: string;
}

/**
 * Translates a permission-related error into a 403 Forbidden exception.
 * Detects insufficient role, access denied, and permission-pattern messages.
 * Has no effect on errors that do not match permission patterns.
 *
 * @param error - The caught error to inspect.
 * @param options - User-facing message and optional permission context.
 * @throws {ForbiddenException} When a permission failure pattern is detected.
 */
export function throwIfForbidden(
  error: unknown,
  options: ForbiddenOptions,
): void {
  if (!error) {
    return;
  }

  const errorObj = error as Record<string, unknown>;
  const message = String(errorObj.message || '').toLowerCase();

  // Check for common permission error patterns
  const isForbiddenError =
    message.includes('forbidden') ||
    message.includes('permission denied') ||
    message.includes('insufficient') ||
    message.includes('not allowed') ||
    message.includes('access denied') ||
    message.includes('role');

  if (!isForbiddenError) {
    return;
  }

  const contextSuffix = options.context ? ` (${options.context})` : '';
  throw new ForbiddenException(`${options.message}${contextSuffix}`);
}

/**
 * Validates that the authenticated user holds the required role.
 *
 * @param userRole - The role assigned to the current user.
 * @param requiredRole - The role that must be present to proceed.
 * @param resourceType - Optional resource label appended to the error message.
 * @throws {ForbiddenException} When userRole does not exactly match requiredRole.
 */
export function assertUserHasRole(
  userRole: string | undefined,
  requiredRole: string,
  resourceType?: string,
): void {
  if (!userRole || userRole !== requiredRole) {
    const resource = resourceType ? ` for ${resourceType}` : '';
    throw new ForbiddenException(
      `User does not have required role '${requiredRole}'${resource}`,
    );
  }
}

/**
 * Validates that the authenticated user is the owner of the resource.
 *
 * @param userId - ID of the authenticated user making the request.
 * @param resourceOwnerId - ID of the user who owns the resource.
 * @param resourceType - Optional resource label appended to the error message.
 * @throws {ForbiddenException} When userId does not match resourceOwnerId.
 */
export function assertResourceOwnership(
  userId: number,
  resourceOwnerId: number,
  resourceType?: string,
): void {
  if (userId !== resourceOwnerId) {
    const resource = resourceType ? ` ${resourceType}` : ' resource';
    throw new ForbiddenException(`User is not authorized to access this${resource}`);
  }
}

/**
 * Validates that the authenticated user meets the minimum required role level.
 * Uses a simple hierarchy: 'admin' (3) > 'moderator' (2) > 'user' (1).
 *
 * @param userRole - Role string assigned to the current user.
 * @param minimumRole - The lowest role level permitted to proceed.
 * @throws {ForbiddenException} When the user's role level is below the required level.
 *
 * @example
 * assertMinimumRoleLevel(currentUser.role, 'moderator');
 */
export function assertMinimumRoleLevel(
  userRole: string | undefined,
  minimumRole: 'admin' | 'moderator' | 'user',
): void {
  const roleHierarchy: Record<string, number> = {
    admin: 3,
    moderator: 2,
    user: 1,
  };

  const userRoleLevel = roleHierarchy[String(userRole).toLowerCase()] || 0;
  const requiredLevel = roleHierarchy[minimumRole];

  if (userRoleLevel < requiredLevel) {
    throw new ForbiddenException(
      `User role is insufficient. Required: '${minimumRole}', Got: '${userRole}'`,
    );
  }
}
