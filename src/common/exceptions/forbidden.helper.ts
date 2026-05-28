import { ForbiddenException } from '@nestjs/common';

/**
 * Options for forbidden exceptions.
 */
interface ForbiddenOptions {
  /**
   * User-facing error message.
   */
  message: string;

  /**
   * Optional context (e.g., 'insufficient role', 'resource ownership').
   */
  context?: string;
}

/**
 * Throws ForbiddenException when user lacks required permissions.
 * Handles: insufficient roles, resource ownership violations, permission checks.
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
 * Validates that user has required role and throws ForbiddenException if not.
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
 * Validates resource ownership and throws ForbiddenException if user is not the owner.
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
 * Validates that user has minimum required role level.
 * Supports simple role hierarchy: 'admin' > 'moderator' > 'user'
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
