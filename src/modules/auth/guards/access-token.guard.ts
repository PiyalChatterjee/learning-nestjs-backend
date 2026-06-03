import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { throwIfUnauthorized } from '../../../common/exceptions/unauthorized.helper';
import { REQUEST_USER_KEY } from '../constants/auth.constant';

/**
 * Guard that validates JWT bearer tokens and attaches decoded claims to the request object.
 *
 * Responsibilities:
 * - Extract token from `Authorization: Bearer <token>` header
 * - Verify token signature/claims with configured JWT secret
 * - Populate request[REQUEST_USER_KEY] for downstream decorators/services
 * - Throw 401 Unauthorized on missing/invalid tokens
 */
@Injectable()
export class AccessTokenGuard implements CanActivate {
  /**
   * Creates AccessTokenGuard dependencies.
   * @param jwtService - Service used to verify JWT access tokens.
   * @param configService - Service used to read JWT settings from appConfig.
   */
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}
  /**
   * Authorizes the current request by validating its bearer token.
   * @param context - Execution context containing the current HTTP request.
   * @returns Promise resolving to true when token verification succeeds.
   * @throws {UnauthorizedException} If token is missing or fails verification.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Extract the request from the execution context.
    const request = context.switchToHttp().getRequest();
    // Extract the token from the authorization header.
    const token = this.extractRequestFromHeader(request);
    // Validate the token using jwtService + config-driven secret/options.
    if (!token) {
      throwIfUnauthorized(new Error('Authentication token is missing'), {
        message: 'Authentication token is missing',
        context: 'access-token-guard',
      });
      throw new UnauthorizedException(
        'Authentication token is missing (access-token-guard)',
      );
    }
    const jwtConfig = this.configService.get('appConfig').jwt;
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: jwtConfig.secret,
        ...jwtConfig.signOptions,
      });
      request[REQUEST_USER_KEY] = payload; // Attach user info to request object for downstream handlers
    } catch (error) {
      throwIfUnauthorized(error, {
        message: 'Invalid authentication token',
        context: 'access-token-guard',
      });
      // If the helper does not detect a known auth pattern, still return a 401 for guard failures.
      throw new UnauthorizedException(
        'Invalid authentication token (access-token-guard)',
      );
    }
    return true;
  }

  /**
   * Returns bearer token value from the Authorization header.
   * @param request - Express request object.
   * @returns Token string when present, otherwise undefined.
   */
  private extractRequestFromHeader(request: Request): string | undefined {
    const [_, requestToken] =
      request.headers['authorization']?.split(' ') || [];
    return requestToken;
  }
}
