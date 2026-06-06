import {
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import {
  validateEmail,
  validatePasswordStrength,
} from '../../../common/exceptions/bad-request.helper';
import { throwIfUnexpectedError } from '../../../common/exceptions/internal-error.helper';
import { throwIfRequestTimeout } from '../../../common/exceptions/request-timeout.helper';
import { throwIfServiceUnavailable } from '../../../common/exceptions/service-unavailable.helper';
import { CreateUserDto } from '../dtos/create-user.dto';
import { User } from '../user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { HashingProvider } from '../../auth/providers/hashing.provider';
import { MailService } from '../../mail/providers/mail.service';

/**
 * Handles single user creation with validation, duplicate checking, and password hashing.
 * Extracted from UsersService to follow the single-responsibility principle.
 */
@Injectable()
export class CreateUserProvider {
  /**
   * @param userRepository - TypeORM repository for persisting and querying User entities.
   * @param hashingProvider - Provider for hashing user passwords before saving to the database.
   *   Uses forwardRef to handle the circular dependency between UsersModule and AuthModule.
   * @param mailService - Service for sending emails to users.
   */
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @Inject(forwardRef(() => HashingProvider))
    private readonly hashingProvider: HashingProvider,

    private readonly mailService: MailService,
  ) {}

  /**
   * Creates and persists a new user after validating input and hashing the password.
   *
   * @param createUserDto - DTO containing the new user's details.
   * @returns The persisted {@link User} entity with a hashed password.
   * @throws BadRequestException if the email format or password strength is invalid.
   * @throws ConflictException if the email address is already in use.
   * @throws RequestTimeoutException if the database operation times out.
   * @throws ServiceUnavailableException if the database is unreachable.
   * @throws InternalServerErrorException for any other unexpected error.
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
        password: await this.hashingProvider.hashPassword(password),
      });

      // save the user to the database
      await this.userRepository.save(user);
      // send welcome email
      await this.mailService.sendWelcomeEmail(user);
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
}
