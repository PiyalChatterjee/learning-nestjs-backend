import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AccessTokenGuard } from './access-token.guard';
import { AuthType } from '../enums/auth-type.enum';
import { AUTH_TYPE_KEY } from '../constants/auth.constant';

/**
 * Global authentication guard that enforces access control based on auth type metadata.
 *
 * This guard reads the {@link AUTH_TYPE_KEY} metadata set by the @Auth() decorator on each
 * route handler or controller class, then dynamically selects the matching guard(s) from
 * the authTypeGuardMap and executes them in sequence.
 *
 * Supported auth types (defined in AuthType enum):
 * - AuthType.None   — Public route; all requests are allowed through.
 * - AuthType.Bearer — Protected route; delegates to AccessTokenGuard for JWT validation.
 *
 * If no @Auth() metadata is present, defaults to AuthType.Bearer (protected access).
 * If any guard in the chain denies access or throws, the request is rejected with 401.
 *
 * @class AuthenticationGuard
 * @implements {CanActivate}
 *
 * @example
 * // Register globally in AppModule so all routes are protected by default
 * app.useGlobalGuards(new AuthenticationGuard(reflector, accessTokenGuard));
 *
 * @example
 * // Mark a route as public (skip JWT validation)
 * @Auth(AuthType.None)
 * @Post('sign-in')
 * signIn() { ... }
 *
 * @example
 * // Require JWT on a specific route (default for guarded routes)
 * @Auth(AuthType.Bearer)
 * @Get('profile')
 * getProfile() { ... }
 */
@Injectable()
export class AuthenticationGuard implements CanActivate {
  /**
   * Default auth type applied when no @Auth() decorator is present on a route.
   * Set to AuthType.Bearer so all undecorated routes require a valid JWT by default.
   * Use @Auth(AuthType.None) to explicitly mark a route as public.
   */
  private static readonly defaultAuthTypes = AuthType.Bearer;

  private readonly authTypeGuardMap: Record<
    AuthType,
    CanActivate | CanActivate[]
  >;

  /**
   * Initializes the AuthenticationGuard and builds the auth-type-to-guard mapping.
   *
   * The authTypeGuardMap is populated here (not as a field initializer) because
   * `this.accessTokenGuard` is only available after constructor injection resolves.
   *
   * @param {Reflector} reflector - NestJS Reflector used to read AUTH_TYPE_KEY metadata
   *                                 from route handlers and controller classes.
   * @param {AccessTokenGuard} accessTokenGuard - Guard that validates JWT Bearer tokens.
   *                                              Injected and mapped to AuthType.Bearer.
   */
  constructor(
    private readonly reflector: Reflector,
    private readonly accessTokenGuard: AccessTokenGuard,
  ) {
    this.authTypeGuardMap = {
      [AuthType.None]: {
        canActivate: () => true, // No authentication required, allow all requests
      }, // No guard, public access
      [AuthType.Bearer]: this.accessTokenGuard, // JWT token validation
    };
  }

  /**
   * Evaluates whether the incoming request is authorized based on the route's auth type.
   *
   * Execution flow:
  * 1. Reads AUTH_TYPE_KEY metadata from the handler and class using the Reflector.
  *    Falls back to [AuthType.Bearer] if no metadata is present.
   * 2. Maps each auth type to its corresponding guard(s) via authTypeGuardMap.
   * 3. Iterates through all resolved guards and calls canActivate() on each.
   * 4. If a guard returns false, throws UnauthorizedException (401).
   * 5. If a guard throws (e.g., AccessTokenGuard throwing 401), the error propagates as-is.
   * 6. Returns true only if all guards pass.
   *
   * @param {ExecutionContext} context - Provides access to the HTTP request/response and
   *                                      route handler metadata (class + method decorators).
   *
   * @returns {Promise<boolean>} Resolves to true when all selected guards approve the request.
   *
   * @throws {UnauthorizedException} If a guard returns false or if AccessTokenGuard
   *                                  rejects the token (missing, expired, or invalid).
   *
   * @example
   * // Route with @Auth(AuthType.None) — Reflector returns [AuthType.None]
   * // authTypeGuardMap[AuthType.None].canActivate() returns true immediately
   *
   * @example
   * // Route with @Auth(AuthType.Bearer) — Reflector returns [AuthType.Bearer]
   * // AccessTokenGuard.canActivate() extracts and verifies the JWT
   * // Throws UnauthorizedException if token is missing or invalid
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // authTypes from reflector
    const authTypes = this.reflector.getAllAndOverride<AuthType[]>(
      AUTH_TYPE_KEY,
      [context.getHandler(), context.getClass()],
    ) || [AuthenticationGuard.defaultAuthTypes];
    // array of guards to execute based on auth type
    const guards = authTypes.map((type) => this.authTypeGuardMap[type]).flat();
    // loop guards canActivate
    for (const guard of guards) {
      const canActivateResult = await Promise.resolve(
        guard.canActivate(context),
      ).catch((error) => {
        // If any guard throws an error, we can log it here or rethrow it as needed.
        throw error; // Let the guard's own error handling propagate (e.g., UnauthorizedException)
      });

      if (!canActivateResult) {
        throw new UnauthorizedException(
          'Access denied by authentication guard',
        );
      }
    }
    return true;
  }
}
