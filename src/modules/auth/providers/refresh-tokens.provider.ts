import {
  forwardRef,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { RefreshTokenDto } from '../dtos/refresh-token.dto';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { GenerateTokensProvider } from './generate-tokens.provider';
import { FindOneUserByEmailProvider } from '../../users/providers/find-one-user-by-email.provider';
import { throwIfUnauthorized } from '../../../common/exceptions/unauthorized.helper';
import { IActiveUser } from '../interfaces/active-user.interface';

/**
 * Provider responsible for validating refresh tokens and issuing new access/refresh token pairs.
 *
 * Validates the incoming refresh token JWT, looks up the associated user by email,
 * and delegates new token generation to {@link GenerateTokensProvider}.
 *
 * @class RefreshTokensProvider
 */
@Injectable()
export class RefreshTokensProvider {
  /**
   * Initializes the RefreshTokensProvider with required dependencies.
   *
   * @param {FindOneUserByEmailProvider} findOneUserByEmailProvider - Looks up a user by the email
   *   claim extracted from the verified refresh token.
   * @param {JwtService} jwtService - Verifies the incoming refresh token JWT.
   * @param {ConfigService} configService - Provides JWT secret, audience, and issuer from app config.
   * @param {GenerateTokensProvider} generateTokensProvider - Issues a new access/refresh token pair
   *   once the user is confirmed.
   */
  constructor(
    @Inject(forwardRef(() => FindOneUserByEmailProvider))
    private readonly findOneUserByEmailProvider: FindOneUserByEmailProvider,
    private readonly jwtService: JwtService,

    private readonly configService: ConfigService,
    private readonly generateTokensProvider: GenerateTokensProvider,
  ) {}

  /**
   * Validates a refresh token and returns a new access/refresh token pair.
   *
   * Flow:
   * 1. Verifies the refresh token JWT signature, audience, and issuer.
   * 2. Extracts the `email` claim from the token payload.
   * 3. Looks up the user by email; throws {@link UnauthorizedException} if not found.
   * 4. Generates and returns a new token pair via {@link GenerateTokensProvider}.
   *
   * @param {RefreshTokenDto} refreshToken - DTO containing the refresh token string to validate.
   * @returns {Promise<{ accessToken: string; refreshToken: string }>} A new token pair.
   *
   * @throws {UnauthorizedException} If the refresh token is invalid, expired, or the user cannot be found.
   *
   * @example
   * const tokens = await refreshTokensProvider.refreshTokens({ refreshToken: 'eyJ...' });
   * // Returns: { accessToken: 'eyJ...', refreshToken: 'eyJ...' }
   */
  public async refreshTokens(refreshToken: RefreshTokenDto) {
    try {
      const { email } = await this.jwtService.verifyAsync<
        Pick<IActiveUser, 'email'>
      >(refreshToken.refreshToken, {
        secret: this.configService.get<string>('appConfig.jwt.secret'),
        audience: this.configService.get<string>(
          'appConfig.jwt.signOptions.audience',
        ),
        issuer: this.configService.get<string>(
          'appConfig.jwt.signOptions.issuer',
        ),
      });
      const user = await this.findOneUserByEmailProvider.findOneByEmail(email);
      if (!user) {
        throwIfUnauthorized(new UnauthorizedException(), {
          message: 'Invalid refresh token',
          context: 'refresh-tokens-provider',
        });
      }
      return this.generateTokensProvider.generateTokens(user);
    } catch (error) {
      throwIfUnauthorized(error, {
        message: 'Invalid refresh token',
        context: 'refresh-tokens-provider',
      });
      throw error;
    }
  }
}
