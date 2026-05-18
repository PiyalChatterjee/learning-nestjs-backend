import { ConflictException, forwardRef, Inject, Injectable } from '@nestjs/common';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { PatchUserDto } from '../dtos/patch-user.dto';
import { AuthService } from '../../auth/provider/auth.service';
import { assertResourceExists } from '../../../common/exceptions/not-found.helper';
import { Repository } from 'typeorm';
import { User } from '../user.entity';
import { InjectRepository } from '@nestjs/typeorm';

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
   */
  constructor(
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}
  // Service methods will go here, utilizing authService for authentication checks and userRepository for database operations.

  /**
   * Creates a new user record.
   */
  public async createUser(createUserDto: CreateUserDto) {
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
  }

  /**
   * Returns a paginated list of users.
   */
  public async getAllUsers(limit: number, page: number) {
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
  }

  /**
   * Returns one user by id.
   */
  public async getUserById(id: number) {
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
  }

  /**
   * Replaces a user record with full update values.
   */
  public async updateUser(id: number, updateUserDto: UpdateUserDto) {
    // fetch the user or throw 404 if not found
    const user = assertResourceExists(
      await this.userRepository.findOne({ where: { id } }),
      'User',
      id,
    );

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
  }

  /**
   * Updates selected fields on a user record.
   */
  public async patchUser(id: number, patchUserDto: PatchUserDto) {
    // fetch the user or throw 404 if not found
    const user = assertResourceExists(
      await this.userRepository.findOne({ where: { id } }),
      'User',
      id,
    );

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
  }

  /**
   * Removes a user by id.
   */
  public async deleteUser(id: number) {
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
  }
}
