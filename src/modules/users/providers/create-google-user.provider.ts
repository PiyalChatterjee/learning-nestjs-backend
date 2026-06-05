import {
  ConflictException,
  Injectable,
  RequestTimeoutException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user.entity';
import { IGoogleUser } from '../interfaces/google-user.interface';
import { throwIfUniqueConstraintViolation } from '../../../common/exceptions/unique-constraint.helper';

/**
 * Handles creation of users who authenticate via Google OAuth.
 *
 * This provider is responsible for persisting new user records that are created
 * as part of the Google OAuth sign-up/sign-in flow. It accepts Google user data
 * (from the Google ID token) and creates a User entity with those credentials.
 *
 * Error Handling:
 * - Catches unique constraint violations on email (user already exists) and throws
 *   a descriptive ConflictException via the helper function.
 *
 * @class CreateGoogleUserProvider
 */
@Injectable()
export class CreateGoogleUserProvider {
  /**
   * Creates an instance of CreateGoogleUserProvider.
   *
   * @param {Repository<User>} usersRepository - TypeORM repository for User entity
   *                                             persistence operations.
   */
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  /**
   * Creates and persists a new User from Google OAuth credentials.
   *
   * Takes the user information extracted from a Google ID token and creates
   * a new User entity in the database. The user will have their googleId set,
   * allowing future sign-ins via the same Google account.
   *
   * @param {IGoogleUser} googleUser - Google user data including googleId, email,
   *                                    firstName, and optionally lastName.
   *
   * @returns {Promise<User>} The newly created and persisted User entity with
   *          an assigned id and database-managed timestamps (createdAt, updatedAt).
   *
   * @throws {ConflictException} If a user with the same email already exists.
   *         Message: "A user with this email already exists".
   *         This handles the case where a user signs up with Google using an
   *         email that was previously registered via traditional email/password.
   *
   * @example
   * // Create a user from Google OAuth data
   * const googleUserData: IGoogleUser = {
   *   googleId: '118123456789',
   *   email: 'john@gmail.com',
   *   firstName: 'John',
   *   lastName: 'Doe'
   * };
   * const newUser = await provider.createGoogleUser(googleUserData);
   * // newUser.id is now assigned, user is persisted in database
   */
  public async createGoogleUser(googleUser: IGoogleUser): Promise<User> {
    try {
      const { googleId, email, firstName, lastName } = googleUser;

      const newUser = this.usersRepository.create({
        googleId,
        email,
        firstName,
        lastName,
      });

      return await this.usersRepository.save(newUser);
    } catch (error) {
      throwIfUniqueConstraintViolation(error, {
        message: 'A user with this email already exists',
        constraint: 'UQ_user_email',
      });
    }
  }
}
