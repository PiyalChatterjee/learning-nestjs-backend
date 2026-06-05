import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './providers/auth.service';
import { SignInDto } from './dtos/signin.dto';
import { Auth } from './decorators/auth.decorator';
import { AuthType } from './enums/auth-type.enum';
import { RefreshTokenDto } from './dtos/refresh-token.dto';
import { Throttle } from '@nestjs/throttler';

/**
 * Authentication controller exposing public and protected authentication-related HTTP endpoints.
 *
 * This controller handles user authentication flows including sign-in operations.
 * All endpoints use the @Auth() decorator to specify required authentication levels:
 * - @Auth(AuthType.None): Public endpoint, no authentication required
 * - @Auth(AuthType.Bearer): Protected endpoint, requires valid JWT access token
 *
 * Endpoints:
 * - POST /v1/auth/sign-in - User login with email and password, returns JWT access token
 *
 * @class AuthController
 */
@Controller('auth')
export class AuthController {
  /**
   * Initializes the AuthController with required dependencies.
   *
   * @param {AuthService} authService - Service handling authentication business logic,
   *                                     including credential validation and token generation.
   */
  constructor(private readonly authService: AuthService) {}

  /**
   * Authenticates a user by email and password, returning a JWT access token.
   *
   * This endpoint is publicly accessible (decorated with @Auth(AuthType.None))
   * and does not require prior authentication. Users provide their credentials
   * in the request body, which are validated against stored hashed passwords.
   *
   * Upon successful authentication, the endpoint returns an access token that can
   * be used in subsequent requests via the Authorization header (Bearer scheme).
   *
   * @param {SignInDto} signInDto - Data transfer object containing user credentials.
   *                                 Must include email and password fields.
   *                                 Email format and password strength are validated
   *                                 according to DTO constraints.
   *
   * @returns {Promise<{message: string, accessToken: string}>} Promise resolving to
   *          an object containing:
   *          - message: Success confirmation message (e.g., "Sign-in successful")
   *          - accessToken: JWT token string for subsequent authenticated requests
   *
   * @throws {UnauthorizedException} If user is not found or password is invalid.
   *                                  Generic message returned to client to prevent
   *                                  email enumeration attacks.
   * @throws {RequestTimeoutException} If the operation exceeds the configured timeout.
   * @throws {ServiceUnavailableException} If authentication service or database is unavailable.
   *
   * @example
   * // Example request
   * POST /v1/auth/sign-in
   * Content-Type: application/json
   *
   * {
   *   "email": "user@example.com",
   *   "password": "SecurePassword123!"
   * }
   *
   * @example
   * // Example successful response (200 OK)
   * {
   *   "message": "Sign-in successful",
   *   "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   * }
   *
   * @example
   * // Using the token in subsequent requests
   * Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   */
  @Auth(AuthType.None)
  @Post('sign-in')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // Limit to 10 sign-in attempts per minute per IP to mitigate brute-force attacks
  @HttpCode(HttpStatus.OK)
  public async signIn(@Body() signInDto: SignInDto) {
    return await this.authService.signIn(signInDto);
  }

  @Auth(AuthType.None)
  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  public async refreshTokens(@Body() refreshTokenDto: RefreshTokenDto) {
    return await this.authService.refreshTokens(refreshTokenDto);
  }
}
