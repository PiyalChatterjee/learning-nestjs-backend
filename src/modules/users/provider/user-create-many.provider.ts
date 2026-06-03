import {
  BadRequestException,
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import {
  validateEmail,
  validatePasswordStrength,
} from '../../../common/exceptions/bad-request.helper';
import { throwIfBulkOperationError } from '../../../common/exceptions/bulk-operation-error.helper';
import { User } from '../user.entity';
import { DataSource } from 'typeorm';
import { CreateManyUsersDto } from '../dtos/create-many-users.dto';
import { CreateUserProvider } from './create-user.provider';
import { HashingProvider } from '../../auth/provider/hashing.provider';

/**
 * Handles bulk user creation within a single atomic database transaction.
 * Extracted from UsersService to keep the service lean and follow
 * the single-responsibility principle.
 */
@Injectable()
export class UserCreateManyProvider {
  /**
   * Maximum number of users allowed in a single batch creation request.
   */
  private readonly MAX_BATCH_SIZE = 100;

  /**
   * @param dataSource - TypeORM DataSource used to create and manage query runners for transactional operations.
   * @param hashingProvider - Provider for hashing user passwords before saving to the database.
   *   Uses forwardRef to handle the circular dependency between UsersModule and AuthModule.
   */
  constructor(
    private readonly dataSource: DataSource,
    @Inject(forwardRef(() => HashingProvider))
    private readonly hashingProvider: HashingProvider,
  ) {}
  /**
   * Creates multiple users in a single atomic transaction.
   * All users are validated and prepared in memory first, then saved in one bulk
   * operation. If any validation or DB error occurs, the entire transaction is
   * rolled back to prevent partial writes.
   *
   * @param createUserDtos - Array of DTOs containing the data for each user to create.
   * @returns The array of persisted {@link User} entities.
   * @throws ConflictException if any email in the batch is already in use.
   * @throws RequestTimeoutException if the database operation times out.
   * @throws ServiceUnavailableException if the database is unreachable.
   * @throws InternalServerErrorException for any other unexpected error.
   */
  public async createManyUsers(createManyUsersDto: CreateManyUsersDto) {
    let newUsers: User[] = [];
    // Create a query runner to manage the transaction for batch user creation
    const queryRunner = this.dataSource.createQueryRunner();
    // Connect the query runner and start a transaction to ensure all-or-nothing behavior for the batch operation
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Validate batch size to prevent resource exhaustion
      if (createManyUsersDto.users.length === 0) {
        throw new BadRequestException('Batch must contain at least one user');
      }
      if (createManyUsersDto.users.length > this.MAX_BATCH_SIZE) {
        throw new BadRequestException(
          `Batch size cannot exceed ${this.MAX_BATCH_SIZE} users`,
        );
      }

      // Detect duplicate emails within the batch to fail fast before DB operations
      const emailsInBatch = new Set<string>();
      for (const dto of createManyUsersDto.users) {
        if (emailsInBatch.has(dto.email)) {
          throw new BadRequestException(
            `Duplicate email in batch: ${dto.email}`,
          );
        }
        emailsInBatch.add(dto.email);
      }

      for (const dto of createManyUsersDto.users) {
        // validate email format
        validateEmail(dto.email);
        // validate password strength
        validatePasswordStrength(dto.password);
        // check if email already exists
        const existingUser = await queryRunner.manager.findOne(User, {
          where: { email: dto.email },
        });
        if (existingUser) {
          throw new ConflictException(`Email ${dto.email} already in use`);
        }
        // configure the user entity in memory so lifecycle hooks are applied
        const newUser = queryRunner.manager.create(User, {
          firstName: dto.firstName,
          lastName: dto.lastName,
          email: dto.email,
          password: await this.hashingProvider.hashPassword(dto.password),
        });
        newUsers.push(newUser);
      }
      // bulk save all prepared user entities in a single operation
      newUsers = await queryRunner.manager.save(newUsers);
      // commit once after all users are successfully prepared and saved
      await queryRunner.commitTransaction();
      return newUsers;
    } catch (error) {
      // Rollback transaction to ensure data integrity on any error
      await queryRunner.rollbackTransaction();
      // Cascade through service unavailable → timeout → unexpected error patterns
      // See bulk-operation-error.helper.ts for the cascading logic
      throwIfBulkOperationError(error, {
        userMessage: 'Failed to create users',
        context: 'users-batch-creation',
      });
    } finally {
      // ensure the query runner is released after the operation is complete, regardless of success or failure, to free up database connections and resources.
      await queryRunner.release();
    }
  }
}
