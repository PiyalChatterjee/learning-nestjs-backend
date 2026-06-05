import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '../../users/user.entity';
import { IActiveUser } from '../interfaces/active-user.interface';

/**
 * Generates JWT (JSON Web Token) access and refresh tokens for authenticated users.
 *
 * This provider encapsulates token generation logic, including signing tokens with
 * the configured JWT secret, setting expiration times, and including claims such as
 * the user ID and email in the token payload.
 *
 * Token Types:
 * - Access Token: Short-lived (default ~15 minutes), used for API authorization.
 * - Refresh Token: Long-lived (default ~7 days), used to obtain new access tokens.
 *
 * @class GenerateTokensProvider
 */
@Injectable()
export class GenerateTokensProvider {
  /**
   * Creates dependencies for token generation operations.
   *
   * @param {JwtService} jwtService - NestJS JWT service for signing and verifying tokens.
   * @param {ConfigService} configService - Service for accessing JWT configuration
   *                                        (secret, expiresIn, audience, issuer).
   */
  constructor(
    private readonly jwtService: JwtService,

    private readonly configService: ConfigService,
  ) {}

  /**
   * Signs a JWT token with the given payload and expiration time.
   *
   * Low-level method that creates a single JWT with a specified expiration.
   * Used internally by generateTokens() and can be called directly for
   * custom token generation scenarios.
   *
   * @template T - Generic type for the optional payload object.
   *
   * @param {number} userId - The user's numeric ID (encoded in 'sub' claim).
   * @param {number} expiresIn - Token expiration time in seconds
   *                            (e.g., 900 for 15 minutes).
   * @param {T} [payload] - Optional additional claims to include in the token
   *                        (e.g., { email: 'user@example.com' }).
   *
   * @returns {Promise<string>} The signed JWT token string.
   *
   * @throws {Error} If JWT signing fails (e.g., missing secret in config).
   *
   * @example
   * // Sign an access token with email claim
   * const accessToken = await provider.signTokens(
   *   42,
   *   900,
   *   { email: 'user@example.com' }
   * );
   * // accessToken is now a valid JWT signed with the app's secret
   *
   * @remarks
   * - The JWT includes standard claims: sub (user ID), iat (issued at), exp (expiration)
   * - Also includes configured audience and issuer from appConfig
   * - Payload is merged with the sub claim (user ID)
   */
  public async signTokens<T>(
    userId: number,
    expiresIn: number,
    payload?: T,
  ): Promise<string> {
    return await this.jwtService.signAsync(
      {
        sub: userId,
        ...payload,
      },
      {
        secret: this.configService.get<string>('appConfig.jwt.secret'),
        expiresIn: expiresIn,
        audience: this.configService.get<string>(
          'appConfig.jwt.signOptions.audience',
        ),
        issuer: this.configService.get<string>(
          'appConfig.jwt.signOptions.issuer',
        ),
      },
    );
  }

  /**
   * Generates both access and refresh tokens for a signed-in user.
   *
   * This is the primary public method for token generation. It creates a pair of tokens:
   * - Access Token: Used for API authorization in subsequent requests
   * - Refresh Token: Used to obtain a new access token when the current one expires
   *
   * Both tokens are signed in parallel for performance.
   *
   * @param {User} user - The authenticated user entity containing id and email.
   *
   * @returns {Promise<{email: string; accessToken: string; refreshToken: string}>}
   *          An object containing:
   *          - email: The user's email address
   *          - accessToken: Short-lived JWT for API authorization
   *          - refreshToken: Long-lived JWT for token renewal
   *
   * @throws {Error} If JWT signing fails (e.g., missing secret in config).
   *
   * @example
   * // Generate tokens after successful password verification
   * const user = await userService.findOneById(42);
   * const tokens = await provider.generateTokens(user);
   * // Returns:
   * // {
   * //   email: 'user@example.com',
   * //   accessToken: 'eyJhbGciOiJIUzI1NiIs...',
   * //   refreshToken: 'eyJhbGciOiJIUzI1NiIs...'
   * // }
   *
   * @remarks
   * - Access token includes email claim for quick access to user identity
   * - Refresh token includes only the user ID (sub claim)
   * - Expiration times are configured in appConfig.jwt
   * - Both tokens use the same secret for signing/verification
   */
  public async generateTokens(
    user: User,
  ): Promise<{ email: string; accessToken: string; refreshToken: string }> {
    const [accessToken, refreshToken] = await Promise.all([
      this.signTokens<Partial<IActiveUser>>(
        user.id,
        this.configService.get<number>('appConfig.jwt.signOptions.expiresIn'),
        { email: user.email },
      ),

      this.signTokens(
        user.id,
        this.configService.get<number>('appConfig.jwt.refreshTokenTtl'),
      ),
    ]);
    return {
      email: user.email,
      accessToken,
      refreshToken,
    };
  }
}
