import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { UsersService } from '../../users/provider/users.service';
import {
  assertTokenExists,
  assertUserAuthenticated,
  throwIfUnauthorized,
} from '../../../common/exceptions/unauthorized.helper';
import { throwIfUnexpectedError } from '../../../common/exceptions/internal-error.helper';
import { SignInDto } from '../dtos/signin.dto';
import { SignInProvider } from './sign-in.provider';

/**
 * Handles authentication and token validation workflow.
 */
@Injectable()
export class AuthService {
  /**
   * Creates dependencies for authentication operations.
   * @param usersService Service for user credential validation and lookup.
   */
  constructor(
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,

    private readonly siginInProvider: SignInProvider,
  ) {}

  /**
   * Validates credentials and returns an access token placeholder.
   */
  public async signIn(signInDto: SignInDto) {
    // Find the user email id and password in the database using usersService
    // throw exceptions if user not found or password is incorrect
    // compare password to the hashed password stored in the database using the hashing provider
    //  send confirmation

    try {
      return await this.siginInProvider.signIn(signInDto);
    } catch (error) {
      throwIfUnauthorized(error, {
        message: 'Invalid email or password',
        context: 'sign-in',
      });
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
