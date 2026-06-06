import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { GoogleAuthenticationService } from './providers/google-authentication.service';
import { GoogleTokenDto } from './dtos/google-token.dto';
import { Auth } from '../decorators/auth.decorator';
import { AuthType } from '../enums/auth-type.enum';

/**
 * Controller for Google OAuth 2.0 authentication endpoints.
 * Handles authentication requests using Google ID tokens and returns JWT tokens.
 */
@Controller('auth/google-authentication')
export class GoogleAuthenticationController {
  /**
   * Initializes the Google authentication controller.
   * @param googleAuthenticationService - Service handling Google OAuth authentication
   */
  constructor(
    private readonly googleAuthenticationService: GoogleAuthenticationService,
  ) {}

  /**
   * Authenticates a user with a Google ID token.
   * Endpoint: POST /auth/google-authentication
   * @param googleTokenDto - DTO containing the Google ID token from client
   * @returns JWT tokens for authenticated user
   * @throws UnauthorizedException if token is invalid or authentication fails
   * @example
   * POST /auth/google-authentication
   * { "token": "eyJhbGciOiJSUzI1NiIs..." }
   */
  @Auth(AuthType.None)
  @Post()
  @HttpCode(HttpStatus.OK)
  public async authenticate(@Body() googleTokenDto: GoogleTokenDto) {
    // This method will be implemented to handle the authentication flow.
    // It will receive the Google token from the client, call the service to authenticate,
    // and return the appropriate response (e.g., JWT tokens).

    return this.googleAuthenticationService.authenticate(googleTokenDto);
  }
}
