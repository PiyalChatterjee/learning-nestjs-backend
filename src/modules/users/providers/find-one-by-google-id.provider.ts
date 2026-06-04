import { Injectable } from '@nestjs/common';
import { User } from '../user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

/**
 * Provides helper methods for finding users by various identifiers.
 */
@Injectable()
export class FindOneByGoogleIdProvider {
  /**
   * Creates an instance of FindOneByGoogleIdProvider.
   *
   * @param usersRepository - TypeORM repository for User entity operations.
   */
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  /**
   * Finds a user by email address.
   *
   * @param email - The email address to search for.
   * @returns The user record if found, null otherwise.
   */
  public async findOneByEmailId(email: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ email });
  }

  /**
   * Finds a user by Google OAuth ID.
   *
   * @param googleId - The Google unique identifier (sub claim from Google ID token).
   * @returns The user record if found, null otherwise.
   */
  public async findOneByGoogleId(googleId: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ googleId });
  }
}
