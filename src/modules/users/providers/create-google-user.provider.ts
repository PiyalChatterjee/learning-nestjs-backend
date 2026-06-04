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

@Injectable()
export class CreateGoogleUserProvider {
  /**
   * Creates an instance of FindOneByGoogleIdProvider.
   *
   * @param usersRepository - TypeORM repository for User entity operations.
   */
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

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
