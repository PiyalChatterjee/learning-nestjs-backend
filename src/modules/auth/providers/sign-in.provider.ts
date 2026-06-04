import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { throwIfUnauthorized } from '../../../common/exceptions/unauthorized.helper';
import { SignInDto } from '../dtos/signin.dto';
import { HashingProvider } from './hashing.provider';
import { throwIfRequestTimeout } from '../../../common/exceptions/request-timeout.helper';
import { throwIfServiceUnavailable } from '../../../common/exceptions/service-unavailable.helper';
import { FindOneUserByEmailProvider } from '../../users/providers/find-one-user-by-email.provider';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { IActiveUser } from '../interfaces/active-user.interface';
import { GenerateTokensProvider } from './generate-tokens.provider';

/**
 * Authentication provider handling user sign-in operations.
 *
 * This injectable service manages the sign-in workflow including:
 * - User email lookup and validation
 * - Password verification using hashing provider
 * - JWT configuration injection for token operations
 *
 * @class SignInProvider
 */
@Injectable()
export class SignInProvider {
  /**
   * Constructor for SignInProvider.
   *
   * @param {FindOneUserByEmailProvider} findOneUserByEmailProvider - Service for finding users by email
   * @param {HashingProvider} hashingProvider - Service for password hashing and comparison
   * @param {GenerateTokensProvider} generateTokensProvider - Service for generating JWT tokens
   */
  constructor(
    @Inject(forwardRef(() => FindOneUserByEmailProvider))
    private readonly findOneUserByEmailProvider: FindOneUserByEmailProvider,

    @Inject(HashingProvider)
    private readonly hashingProvider: HashingProvider,



    private readonly generateTokensProvider: GenerateTokensProvider,
  ) {}

  /**
   * Authenticates a user by email and password.
   *
   * Validates user credentials by:
   * 1. Looking up user by email
   * 2. Comparing provided password against stored hash
   * 3. Returning success message on valid credentials
   *
   * @param {SignInDto} signInDto - Sign-in request containing email and password
   * @returns {Promise<{message: string, accessToken: string}>} Success confirmation message with JWT access token
   *
   * @throws {UnauthorizedException} If user not found or password is invalid
   * @throws {RequestTimeoutException} If the operation times out
   * @throws {ServiceUnavailableException} If authentication service is unavailable
   *
   * @example
   * const result = await signInProvider.signIn({
   *   email: 'user@example.com',
   *   password: 'password123'
   * });
   * // Returns: { message: 'Sign-in successful', accessToken: '...', refreshToken: '...' }
   */
  public async signIn(
    signInDto: SignInDto,
  ): Promise<{ message: string; accessToken: string, refreshToken: string }> {
    try {
      const user = await this.findOneUserByEmailProvider.findOneByEmail(
        signInDto.email,
      );
      if (!user) {
        throwIfUnauthorized(new Error('User not found'), {
          message: 'Invalid email or password',
          context: 'sign-in',
        });
      }

      const isPasswordValid = await this.hashingProvider.comparePassword(
        signInDto.password,
        user.password,
      );

      if (!isPasswordValid) {
        throwIfUnauthorized(new Error('Invalid password'), {
          message: 'Invalid email or password',
          context: 'sign-in',
        });
      }

      return await this.generateTokensProvider
        .generateTokens(user)
        .then((tokens) => ({
          message: 'Sign-in successful',
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        }));
    } catch (error) {
      throwIfRequestTimeout(error, {
        message: 'Failed to sign in',
        context: 'sign-in',
      });

      throwIfServiceUnavailable(error, {
        message: 'Authentication service is currently unavailable',
        serviceName: 'authentication',
        shouldLog: true,
      });

      throwIfUnauthorized(error, {
        message: 'Invalid email or password',
        context: 'sign-in',
      });

      throw error;
    }
  }
}
