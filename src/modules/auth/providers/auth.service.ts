import { Injectable } from '@nestjs/common';
import {
  assertTokenExists,
  throwIfUnauthorized,
} from '../../../common/exceptions/unauthorized.helper';
import { throwIfUnexpectedError } from '../../../common/exceptions/internal-error.helper';
import { throwIfRequestTimeout } from '../../../common/exceptions/request-timeout.helper';
import { throwIfServiceUnavailable } from '../../../common/exceptions/service-unavailable.helper';
import { SignInDto } from '../dtos/signin.dto';
import { SignInProvider } from './sign-in.provider';
import { RefreshTokenDto } from '../dtos/refresh-token.dto';
import { RefreshTokensProvider } from './refresh-tokens.provider';

/**
 * Handles authentication and token validation workflow.
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly signInProvider: SignInProvider,
    private readonly refreshTokensProvider: RefreshTokensProvider,
  ) {}

  /**
   * Validates credentials and returns an access token placeholder.
   */
  public async signIn(signInDto: SignInDto) {
    try {
      return await this.signInProvider.signIn(signInDto);
    } catch (error) {
      throwIfRequestTimeout(error, {
        message: 'Failed to sign in',
        context: 'auth-service-sign-in',
      });

      throwIfServiceUnavailable(error, {
        message: 'Authentication service is currently unavailable',
        serviceName: 'authentication',
        shouldLog: true,
      });

      throwIfUnauthorized(error, {
        message: 'Invalid email or password',
        context: 'auth-service-sign-in',
      });

      throwIfUnexpectedError(error, {
        userMessage: 'Failed to complete sign-in',
        context: 'auth-service-sign-in',
        originalError: error,
      });

      throw error;
    }
  }

  public async refreshTokens(refreshTokenDto: RefreshTokenDto) {
    try {
      return await this.refreshTokensProvider.refreshTokens(refreshTokenDto);
    } catch (error) {
      throwIfRequestTimeout(error, {
        message: 'Failed to refresh tokens',
        context: 'auth-service-refresh-tokens',
      });
      throwIfServiceUnavailable(error, {
        message: 'Authentication service is currently unavailable',
        serviceName: 'authentication',
        shouldLog: true,
      });

      throwIfUnauthorized(error, {
        message: 'Invalid refresh token',
        context: 'auth-service-refresh-tokens',
      });

      throwIfUnexpectedError(error, {
        userMessage: 'Failed to refresh tokens',
        context: 'auth-service-refresh-tokens',
        originalError: error,
      });

      throw error;
    }
  }

  /**
   * Checks whether an authentication token is valid.
   */
  public isAuthenticated(token: string): boolean {
    try {
      // Validate token is provided
      assertTokenExists(token);

      // Implement your token validation logic here, such as verifying the token's signature and expiration.
      return true;
    } catch (error) {
      throwIfUnauthorized(error, {
        message: 'Invalid or expired authentication token',
        context: 'token-validation',
      });
      // If not an auth error, log it
      throwIfUnexpectedError(error, {
        userMessage: 'Token validation failed',
        context: 'auth-token-check',
        originalError: error,
      });
      return false;
    }
  }
}
