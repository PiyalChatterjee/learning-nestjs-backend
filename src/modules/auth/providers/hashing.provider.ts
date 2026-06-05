import { Injectable } from '@nestjs/common';

/**
 * Abstract base class for password hashing implementations.
 *
 * This interface defines the contract for password hashing strategies.
 * Concrete implementations (e.g., BcryptProvider) provide specific algorithms.
 *
 * This design allows swapping hashing algorithms without changing service code,
 * supporting future migration from bcrypt to other algorithms (e.g., Argon2, scrypt).
 *
 * @abstract
 * @class HashingProvider
 */
@Injectable()
export abstract class HashingProvider {
  /**
   * Hashes a plain-text password using the implemented algorithm.
   *
   * Must be implemented by concrete providers to securely hash passwords
   * for storage in the database. The hash should be deterministic within
   * the context of a unique salt (i.e., same password produces different hashes).
   *
   * @abstract
   * @param {string | Buffer} data - The plain-text password to hash.
   *
   * @returns {Promise<string>} A hash string suitable for storage in a database.
   *
   * @throws {Error} If hashing operations fail.
   *
   * @example
   * const hash = await provider.hashPassword('MyPassword123!');
   * // Store hash in database
   */
  abstract hashPassword(data: string | Buffer): Promise<string>;

  /**
   * Compares a plain-text password against a stored hash.
   *
   * Must be implemented by concrete providers to verify passwords during
   * sign-in. Should use constant-time comparison to prevent timing attacks.
   * Returns false (not an exception) if passwords don't match.
   *
   * @abstract
   * @param {string | Buffer} data - The plain-text password to verify.
   * @param {string} encrypted - The stored hash to compare against.
   *
   * @returns {Promise<boolean>} True if the password matches the hash,
   *          false otherwise.
   *
   * @throws {Error} If comparison operations fail.
   *
   * @example
   * const isMatch = await provider.comparePassword('MyPassword123!', storedHash);
   * if (!isMatch) throw new UnauthorizedException('Invalid credentials');
   */
  abstract comparePassword(
    data: string | Buffer,
    encrypted: string,
  ): Promise<boolean>;
}
