import {
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { PatchUserDto } from '../dtos/patch-user.dto';
import { AuthService } from '../../auth/provider/auth.service';
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

/**
 * Internal representation of persisted user data.
 */
type UserRecord = {
  id: number;
  firstName: string;
  lastName?: string;
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
  private readonly users: UserRecord[] = [
    {
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
    },
  ];

  /**
   * Inject the AuthService into the UsersService using dependency injection. This allows us to use the methods defined in the AuthService to handle authentication-related logic in our user service, such as validating user credentials or checking if a user is authenticated before allowing access to certain user-related operations.
   * Inject User Repository to manage user data persistence and retrieval from the database. This allows us to perform CRUD operations on user entities using TypeORM's repository pattern, abstracting away the underlying database interactions and providing a clean interface for working with user data in our service.
   * Inject profile configuration to access any profile-related settings defined in the application's configuration files. This allows us to utilize configuration values that may be necessary for user-related operations, such as API keys, feature flags, or other settings that can be defined in the profile configuration.
   * Inject create many provider to handle batch user creation logic in a separate provider class, allowing us to keep our service methods focused and maintain separation of concerns. This also allows us to reuse the batch creation logic in different parts of the application if needed, while keeping it encapsulated within its own provider.
   */
  constructor(
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @Inject(profileConfig.KEY)
    private readonly profileConfiguration: ConfigType<typeof profileConfig>,

    private readonly userCreateManyProvider: UserCreateManyProvider,
  ) {}
  // Service methods will go here, utilizing authService for authentication checks and userRepository for database operations.

  /**
   * Creates a new user record.
   */
  public async createUser(createUserDto: CreateUserDto) {
    try {
      // validate email format
      validateEmail(createUserDto.email);

      // validate password strength
      validatePasswordStrength(createUserDto.password);

      // check if email already exists
      const existingUser = await this.userRepository.findOne({
        where: { email: createUserDto.email },
      });
      if (existingUser) {
        throw new ConflictException('Email already in use');
      }

      // configure the user entity
      const { firstName, lastName, email, password } = createUserDto;
      const user = this.userRepository.create({
        firstName,
        lastName,
        email,
        password,
      });

      // save the user to the database
      await this.userRepository.save(user);
      return user;
    } catch (error) {
      throwIfServiceUnavailable(error, {
        message: 'Cannot create user at this moment',
        serviceName: 'database',
        shouldLog: true,
      });
      throwIfRequestTimeout(error, {
        message: 'Failed to create user',
        context: 'database query',
      });
      throwIfUnexpectedError(error, {
        userMessage: 'Failed to create user',
        context: 'user-creation',
        originalError: error,
      });
      throw error;
    }
  }

  /**
   * Create many user records
   */
  public async createManyUsers(createManyUsersDto: CreateManyUsersDto) {
    return await this.userCreateManyProvider.createManyUsers(createManyUsersDto);
  }

  /**
   * Returns a paginated list of users.
   */
  public async getAllUsers(limit: number, page: number) {
    try {
      // verify the caller is authenticated
      const isAuthenticated = this.authService.isAuthenticated('SAMPLE_TOKEN');
      if (!isAuthenticated) {
        throw new Error('Unauthorized');
      }

      // calculate pagination offset and fetch the page from the database
      const offset = (page - 1) * limit;
      const users = await this.userRepository.find({
        skip: offset,
        take: limit,
      });

      // shape and return the response
      return users.map((user) => ({
        id: user.id,
        name: `${user.firstName} ${user.lastName ?? ''}`.trim(),
        email: user.email,
      }));
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
  public async getUserById(id: number) {
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
  public async updateUser(id: number, updateUserDto: UpdateUserDto) {
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
  public async patchUser(id: number, patchUserDto: PatchUserDto) {
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
  public async deleteUser(id: number) {
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
}
