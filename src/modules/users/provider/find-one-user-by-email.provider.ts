import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from '../user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { throwIfRequestTimeout } from '../../../common/exceptions/request-timeout.helper';
import { throwIfServiceUnavailable } from '../../../common/exceptions/service-unavailable.helper';
import { throwIfUnexpectedError } from '../../../common/exceptions/internal-error.helper';

/**
 * Retrieves a single user by email for authentication and lookup flows.
 */
@Injectable()
export class FindOneUserByEmailProvider {
  /**
   * @param userRepository TypeORM repository used to query persisted users.
   */
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Finds a user by email address.
   *
   * @param email Email address to search for.
   * @returns The matching user, or null when no user exists for that email.
   * @throws ServiceUnavailableException when the database service is unavailable.
   * @throws RequestTimeoutException when the database query times out.
   * @throws InternalServerErrorException for unexpected non-HTTP errors.
   */
  public async findOneByEmail(email: string): Promise<User | null> {
    try {
      return this.userRepository.findOne({ where: { email } });
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
}
