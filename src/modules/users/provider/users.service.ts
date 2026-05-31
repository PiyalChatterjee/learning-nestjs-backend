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
import { PaginationQueryDto } from '../../../common/paginations/dtos/pagination-query.dto';
import { PaginationProvider } from '../../../common/paginations/provider/pagination.provider';
import { IPaginated } from '../../../common/paginations/interfaces/paginated.interface';
import { TDeleteResult } from '../../../common/types/delete-result.type';

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
  ) {}
  // Service methods will go here, utilizing authService for authentication checks and userRepository for database operations.

  /**
   * Creates a new user record.
   */
  public async createUser(createUserDto: CreateUserDto): Promise<User> {
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
   * Creates multiple user records in a single atomic transaction.
   * Delegates to UserCreateManyProvider which handles batch validation,
   * duplicate email detection, and transactional persistence.
   * See UserCreateManyProvider for detailed bulk operation semantics.
   */
  public async createManyUsers(createManyUsersDto: CreateManyUsersDto): Promise<User[]> {
    return await this.userCreateManyProvider.createManyUsers(createManyUsersDto);
  }

  /**
   * Returns a paginated list of users.
   */
  public async getAllUsers(paginationQuery: PaginationQueryDto): Promise<IPaginated<TUserSummary>> {
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
  public async updateUser(id: number, updateUserDto: UpdateUserDto): Promise<TUserSummary> {
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
  public async patchUser(id: number, patchUserDto: PatchUserDto): Promise<TUserSummary> {
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
}
