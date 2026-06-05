import {
  UnauthorizedException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';
import { GoogleTokenDto } from '../dtos/google-token.dto';
import { throwIfUnauthorized } from '../../../../common/exceptions/unauthorized.helper';
import { throwIfServiceUnavailable } from '../../../../common/exceptions/service-unavailable.helper';
import { throwIfRequestTimeout } from '../../../../common/exceptions/request-timeout.helper';
import { UsersService } from '../../../users/providers/users.service';
import { GenerateTokensProvider } from '../../providers/generate-tokens.provider';

/**
 * Manages Google OAuth 2.0 authentication flows.
 * Wraps the Google Auth Library OAuth2Client and provides methods
 * for verifying ID tokens and exchanging authorization codes.
 * Credentials are loaded from appConfig.jwt.googleOAuth namespace.
 * Generates application JWT tokens after successful Google authentication.
 */
@Injectable()
export class GoogleAuthenticationService {
  private oauth2Client: OAuth2Client;

  /**
   * Creates an instance of GoogleAuthenticationService.
   *
   * @param configService - NestJS ConfigService for accessing app configuration.
   *                        Reads googleOAuth credentials from appConfig.jwt.googleOAuth namespace.
   * @param jwtService - NestJS JwtService for signing and verifying JWT tokens.
   *                     Used to generate access and refresh tokens after successful Google authentication.
   */
  constructor(
    private readonly configService: ConfigService,

    private readonly jwtService: JwtService,

    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,

    private readonly generateTokensProvider: GenerateTokensProvider,
  ) {
    const clientId = this.configService.get<string>(
      'appConfig.jwt.googleOAuth.clientId',
    );
    const clientSecret = this.configService.get<string>(
      'appConfig.jwt.googleOAuth.clientSecret',
    );
    this.oauth2Client = new OAuth2Client(clientId, clientSecret);
  }

  public async authenticate(googleTokenDto: GoogleTokenDto) {
    try {
      // Defensive guard for edge cases where lifecycle init does not run as expected.
      if (!this.oauth2Client) {
        const clientId = this.configService.get<string>(
          'appConfig.jwt.googleOAuth.clientId',
        );
        const clientSecret = this.configService.get<string>(
          'appConfig.jwt.googleOAuth.clientSecret',
        );
        this.oauth2Client = new OAuth2Client(clientId, clientSecret);
      }

      // Verify the Google ID token and extract user information
      const ticket = await this.oauth2Client.verifyIdToken({
        idToken: googleTokenDto.token,
        audience: this.configService.get<string>(
          'appConfig.jwt.googleOAuth.clientId',
        ),
      });
      const payload = ticket.getPayload();

      if (!payload?.sub) {
        throw new UnauthorizedException(
          'Invalid Google ID token (missing subject claim)',
        );
      }

      const {
        sub: googleId,
        email,
        email_verified: emailVerified,
        given_name: firstName,
        family_name: lastName,
      } = payload;

      if (!email || !emailVerified) {
        throw new UnauthorizedException(
          'Invalid Google ID token (missing or unverified email)',
        );
      }

      const user = await this.usersService.findOneByGoogleId(googleId);

      if (user) {
        return await this.generateTokensProvider.generateTokens(user);
      }

      const existingEmailUser = await this.usersService.findOneByEmail(email);

      if (existingEmailUser) {
        if (
          existingEmailUser.googleId &&
          existingEmailUser.googleId !== googleId
        ) {
          throw new UnauthorizedException(
            'Google account is already linked to another user',
          );
        }

        const linkedUser = existingEmailUser.googleId
          ? existingEmailUser
          : await this.usersService.linkGoogleAccount(
              existingEmailUser.id,
              googleId,
            );

        return await this.generateTokensProvider.generateTokens(linkedUser);
      }

      // If user does not exist, create a new user record
      const newUser = await this.usersService.createGoogleUser({
        email,
        firstName,
        lastName,
        googleId,
      });
      return await this.generateTokensProvider.generateTokens(newUser);
    } catch (error) {
      throwIfRequestTimeout(error, {
        message: 'Google authentication request timed out',
        context: 'google-authentication-service',
      });
      throwIfServiceUnavailable(error, {
        message: 'Google authentication service is currently unavailable',
        serviceName: 'google-authentication',
        shouldLog: true,
      });
      throwIfUnauthorized(error, {
        message: 'Invalid Google ID token',
        context: 'google-authentication-service',
      });
      console.error('Error verifying Google ID token:', error);
      throw error;
    }
  }
}
