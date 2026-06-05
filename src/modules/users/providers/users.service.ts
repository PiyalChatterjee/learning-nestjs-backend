import {
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { PatchUserDto } from '../dtos/patch-user.dto';
import { AuthService } from '../../auth/providers/auth.service';
import { assertResourceExists } from '../../../common/exceptions/not-found.helper';
import { throwIfRequestTimeout } from '../../../common/exceptions/request-timeout.helper';
import {
  validateEmail,
  validatePasswordStrength,
} from '../../../common/exceptions/bad-request.helper';
import { throwIfServiceUnavailable } from '../../../common/exceptions/service-unavailable.helper';
import { throwIfUnexpectedError } from '../../../common/exceptions/internal-error.helper';
import { Repository } from 'typeorm';
import { User } from '../user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import profileConfig from '../config/profile.config';
import { ConfigType } from '@nestjs/config';
import { UserCreateManyProvider } from './user-create-many.provider';
import { CreateManyUsersDto } from '../dtos/create-many-users.dto';
import { PaginationQueryDto } from '../../../common/paginations/dtos/pagination-query.dto';
import { PaginationProvider } from '../../../common/paginations/provider/pagination.provider';
import { IPaginated } from '../../../common/paginations/interfaces/paginated.interface';
import { TDeleteResult } from '../../../common/types/delete-result.type';
import { HashingProvider } from '../../auth/providers/hashing.provider';
import { CreateUserProvider } from './create-user.provider';
import { FindOneUserByEmailProvider } from './find-one-user-by-email.provider';
import { FindOneByGoogleIdProvider } from './find-one-by-google-id.provider';
import { IGoogleUser } from '../interfaces/google-user.interface';
import { CreateGoogleUserProvider } from './create-google-user.provider';
import { throwIfUnauthorized } from '../../../common/exceptions/unauthorized.helper';

/**
 * Internal representation of persisted user data.
 */
type TUserRecord = {
  id: number;
  firstName: string;
  lastName?: string;
  email: string;
};

/**
 * Public-facing user shape returned from read operations.
 */
type TUserSummary = {
  id: number;
  name: string;
  email: string;
};

/**
 * Manages user CRUD behavior for the module.
 */
@Injectable()
export class UsersService {
  /**
   * In-memory users collection for local learning scenarios.
   */
  private readonly users: TUserRecord[] = [
    {
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
    },
  ];

  /**
   * Creates dependencies for user management operations.
   * @param authService Service for user authentication and authorization checks.
   * @param userRepository Repository for persisting and retrieving user entities.
   * @param profileConfiguration Configuration values for user profile settings.
   * @param userCreateManyProvider Provider for atomic batch user creation operations.
   * @param paginationProvider Provider for consistent pagination across user queries.
   * @param createUserProvider Provider for encapsulated user creation logic, including validation and hashing.
   * @param findOneUserByEmailProvider Provider for finding users by email address.
   * @param findOneByGoogleIdProvider Provider for finding users by Google OAuth ID.
   */
  constructor(
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @Inject(profileConfig.KEY)
    private readonly profileConfiguration: ConfigType<typeof profileConfig>,

    private readonly userCreateManyProvider: UserCreateManyProvider,
    private readonly paginationProvider: PaginationProvider,

    private readonly createUserProvider: CreateUserProvider,
    private readonly findOneUserByEmailProvider: FindOneUserByEmailProvider,
    private readonly findOneByGoogleIdProvider: FindOneByGoogleIdProvider,
    private readonly createGoogleUserProvider: CreateGoogleUserProvider,
  ) {}
  // Service methods will go here, utilizing authService for authentication checks and userRepository for database operations.

  /**
   * Creates a new user record.
   */
  public async createUser(createUserDto: CreateUserDto): Promise<User> {
    return this.createUserProvider.createUser(createUserDto);
  }

  /**
   * Creates multiple user records in a single atomic transaction.
   * Delegates to UserCreateManyProvider which handles batch validation,
   * duplicate email detection, and transactional persistence.
   * See UserCreateManyProvider for detailed bulk operation semantics.
   */
  public async createManyUsers(
    createManyUsersDto: CreateManyUsersDto,
  ): Promise<User[]> {
    return await this.userCreateManyProvider.createManyUsers(
      createManyUsersDto,
    );
  }

  /**
   * Returns a paginated list of users.
   */
  public async getAllUsers(
    paginationQuery: PaginationQueryDto,
  ): Promise<IPaginated<TUserSummary>> {
    try {
      // verify the caller is authenticated
      const isAuthenticated = this.authService.isAuthenticated('SAMPLE_TOKEN');
      if (!isAuthenticated) {
        throw new Error('Unauthorized');
      }

      // paginate users through the shared pagination provider
      const users = await this.paginationProvider.paginateQuery(
        {
          page: paginationQuery.page || 1,
          limit: paginationQuery.limit || 10,
        },
        this.userRepository,
        {
          order: { id: 'DESC' },
        },
      );

      // shape and return the paginated response
      return {
        ...users,
        data: users.data.map((user) => ({
          id: user.id,
          name: `${user.firstName} ${user.lastName ?? ''}`.trim(),
          email: user.email,
        })),
      };
    } catch (error) {
      throwIfServiceUnavailable(error, {
        message: 'Cannot fetch users at this moment',
        serviceName: 'database',
        shouldLog: true,
      });
      throwIfRequestTimeout(error, {
        message: 'Failed to fetch users',
        context: 'database query',
      });
      throwIfUnexpectedError(error, {
        userMessage: 'Failed to fetch users',
        context: 'user-fetch',
        originalError: error,
      });
      throw error;
    }
  }

  /**
   * Returns one user by id.
   */
  public async getUserById(id: number): Promise<TUserSummary> {
    try {
      // verify the caller is authenticated
      const isAuthenticated = this.authService.isAuthenticated('SAMPLE_TOKEN');
      if (!isAuthenticated) {
        throw new Error('Unauthorized');
      }

      // fetch the user or throw 404 if not found
      const user = assertResourceExists(
        await this.userRepository.findOne({ where: { id } }),
        'User',
        id,
      );

      // shape and return the response
      return {
        id: user.id,
        name: `${user.firstName} ${user.lastName ?? ''}`.trim(),
        email: user.email,
      };
    } catch (error) {
      throwIfServiceUnavailable(error, {
        message: 'Cannot fetch user at this moment',
        serviceName: 'database',
        shouldLog: true,
      });
      throwIfRequestTimeout(error, {
        message: 'Failed to fetch user',
        context: 'database query',
      });
      throwIfUnexpectedError(error, {
        userMessage: 'Failed to fetch user',
        context: 'user-fetch-by-id',
        originalError: error,
      });
      throw error;
    }
  }

  /**
   * Replaces a user record with full update values.
   */
  public async updateUser(
    id: number,
    updateUserDto: UpdateUserDto,
  ): Promise<TUserSummary> {
    try {
      // validate email format if provided
      validateEmail(updateUserDto.email);

      // fetch the user or throw 404 if not found
      const user = assertResourceExists(
        await this.userRepository.findOne({ where: { id } }),
        'User',
        id,
      );

      // check if new email is already in use by another user
      if (updateUserDto.email && updateUserDto.email !== user.email) {
        const existingUser = await this.userRepository.findOne({
          where: { email: updateUserDto.email },
        });
        if (existingUser) {
          throw new ConflictException('Email already in use');
        }
      }

      // apply all fields from the update payload
      const { firstName, lastName, email } = updateUserDto;
      user.firstName = firstName;
      user.lastName = lastName;
      user.email = email;

      // persist changes and return the updated record
      await this.userRepository.save(user);
      return {
        id: user.id,
        name: `${user.firstName} ${user.lastName ?? ''}`.trim(),
        email: user.email,
      };
    } catch (error) {
      throwIfServiceUnavailable(error, {
        message: 'Cannot update user at this moment',
        serviceName: 'database',
        shouldLog: true,
      });
      throwIfRequestTimeout(error, {
        message: 'Failed to update user',
        context: 'database query',
      });
      throwIfUnexpectedError(error, {
        userMessage: 'Failed to update user',
        context: 'user-update',
        originalError: error,
      });
      throw error;
    }
  }

  /**
   * Updates selected fields on a user record.
   */
  public async patchUser(
    id: number,
    patchUserDto: PatchUserDto,
  ): Promise<TUserSummary> {
    try {
      // validate email format if provided
      if (patchUserDto.email) {
        validateEmail(patchUserDto.email);
      }

      // fetch the user or throw 404 if not found
      const user = assertResourceExists(
        await this.userRepository.findOne({ where: { id } }),
        'User',
        id,
      );

      // check if new email is already in use by another user (if email is being updated)
      if (patchUserDto.email && patchUserDto.email !== user.email) {
        const existingUser = await this.userRepository.findOne({
          where: { email: patchUserDto.email },
        });
        if (existingUser) {
          throw new ConflictException('Email already in use');
        }
      }

      // strip undefined fields so only provided values are applied
      const partialPayload = Object.fromEntries(
        Object.entries(patchUserDto).filter(([, value]) => value !== undefined),
      );

      // merge partial fields and persist the updated record
      Object.assign(user, partialPayload);
      await this.userRepository.save(user);
      return {
        id: user.id,
        name: `${user.firstName} ${user.lastName ?? ''}`.trim(),
        email: user.email,
      };
    } catch (error) {
      throwIfServiceUnavailable(error, {
        message: 'Cannot patch user at this moment',
        serviceName: 'database',
        shouldLog: true,
      });
      throwIfRequestTimeout(error, {
        message: 'Failed to patch user',
        context: 'database query',
      });
      throwIfUnexpectedError(error, {
        userMessage: 'Failed to patch user',
        context: 'user-patch',
        originalError: error,
      });
      throw error;
    }
  }

  /**
   * Removes a user by id.
   */
  public async deleteUser(id: number): Promise<TDeleteResult> {
    try {
      // fetch the user or throw 404 if not found
      const user = assertResourceExists(
        await this.userRepository.findOne({ where: { id } }),
        'User',
        id,
      );

      // remove the record from the database
      await this.userRepository.remove(user);

      return {
        message: `User with id ${id} deleted successfully`,
      };
    } catch (error) {
      throwIfServiceUnavailable(error, {
        message: 'Cannot delete user at this moment',
        serviceName: 'database',
        shouldLog: true,
      });
      throwIfRequestTimeout(error, {
        message: 'Failed to delete user',
        context: 'database query',
      });
      throwIfUnexpectedError(error, {
        userMessage: 'Failed to delete user',
        context: 'user-delete',
        originalError: error,
      });
      throw error;
    }
  }

  public async findOneByEmail(email: string): Promise<User | null> {
    try {
      return await this.findOneUserByEmailProvider.findOneByEmail(email);
    } catch (error) {
      throwIfServiceUnavailable(error, {
        message: 'Cannot fetch user at this moment',
        serviceName: 'database',
        shouldLog: true,
      });
      throwIfRequestTimeout(error, {
        message: 'Failed to fetch user',
        context: 'database query',
      });
      throwIfUnexpectedError(error, {
        userMessage: 'Failed to fetch user',
        context: 'user-find-by-email',
        originalError: error,
      });
      throw error;
    }
  }

  /**
   * Finds a user by internal numeric id.
   *
   * @param id - The user id from JWT subject claim.
   * @returns The persisted user entity if found, otherwise null.
   */
  public async findOneById(id: number): Promise<User | null> {
    try {
      return await this.userRepository.findOne({ where: { id } });
    } catch (error) {
      throwIfServiceUnavailable(error, {
        message: 'Cannot fetch user at this moment',
        serviceName: 'database',
        shouldLog: true,
      });
      throwIfRequestTimeout(error, {
        message: 'Failed to fetch user',
        context: 'database query',
      });
      throwIfUnexpectedError(error, {
        userMessage: 'Failed to fetch user',
        context: 'user-find-by-id',
        originalError: error,
      });
      throw error;
    }
  }

  /**
   * Finds a user by Google OAuth ID.
   * Used during Google OAuth authentication flow to check if user already exists.
   *
   * @param googleId - The Google unique identifier (sub claim from Google ID token).
   * @returns The user record if found, null if no user is associated with this Google ID.
   * @throws {ServiceUnavailableException} If the database is unavailable.
   * @throws {RequestTimeoutException} If the query times out.
   * @throws {InternalServerErrorException} For unexpected errors.
   */
  public async findOneByGoogleId(googleId: string): Promise<User | null> {
    try {
      return await this.findOneByGoogleIdProvider.findOneByGoogleId(googleId);
    } catch (error) {
      throwIfServiceUnavailable(error, {
        message: 'Cannot fetch user at this moment',
        serviceName: 'database',
        shouldLog: true,
      });
      throwIfRequestTimeout(error, {
        message: 'Failed to fetch user',
        context: 'database query',
      });
      throwIfUnexpectedError(error, {
        userMessage: 'Failed to fetch user',
        context: 'user-find-by-google-id',
        originalError: error,
      });
      throw error;
    }
  }

  public async createGoogleUser(googleUser: IGoogleUser): Promise<User> {
    try {
      return await this.createGoogleUserProvider.createGoogleUser(googleUser);
    } catch (error) {
      throwIfServiceUnavailable(error, {
        message: 'Cannot create Google user at this moment',
        serviceName: 'database',
        shouldLog: true,
      });
      throwIfRequestTimeout(error, {
        message: 'Failed to create Google user',
        context: 'database query',
      });
      throwIfUnexpectedError(error, {
        userMessage: 'Failed to create Google user',
        context: 'user-create-google',
        originalError: error,
      });
      throw error;
    }
  }

  /**
   * Links a Google account id to an existing user.
   *
   * @param userId - Internal user id to link.
   * @param googleId - Google subject claim to attach to this user.
   * @returns The updated user with linked googleId.
   */
  public async linkGoogleAccount(userId: number, googleId: string): Promise<User> {
    try {
      const user = assertResourceExists(
        await this.userRepository.findOne({ where: { id: userId } }),
        'User',
        userId,
      );

      const existingGoogleUser = await this.userRepository.findOne({
        where: { googleId },
      });

      if (existingGoogleUser && existingGoogleUser.id !== userId) {
        throwIfUnauthorized(new UnauthorizedException(), {
          message: 'Google account is already linked to another user',
          context: 'user-link-google-account',
        });
      }

      user.googleId = googleId;

      return await this.userRepository.save(user);
    } catch (error) {
      throwIfServiceUnavailable(error, {
        message: 'Cannot link Google account at this moment',
        serviceName: 'database',
        shouldLog: true,
      });
      throwIfRequestTimeout(error, {
        message: 'Failed to link Google account',
        context: 'database query',
      });
      throwIfUnexpectedError(error, {
        userMessage: 'Failed to link Google account',
        context: 'user-link-google-account',
        originalError: error,
      });
      throw error;
    }
  }
}
