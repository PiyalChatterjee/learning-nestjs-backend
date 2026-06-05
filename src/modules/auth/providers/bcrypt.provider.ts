import { Injectable } from '@nestjs/common';
import { HashingProvider } from './hashing.provider';
import * as bcrypt from 'bcrypt';

/**
 * Password hashing implementation using the bcrypt algorithm.
 *
 * Bcrypt is a password hashing function designed for securely storing passwords.
 * It includes built-in salt generation and a configurable cost factor (work factor)
 * that makes brute-force attacks computationally expensive.
 *
 * This implementation uses:
 * - Salt rounds: 10 (balances security with performance)
 * - Algorithm: bcrypt with SHA-512 under the hood
 *
 * @class BcryptProvider
 * @implements {HashingProvider}
 */
@Injectable()
export class BcryptProvider implements HashingProvider {
  /**
   * Hashes a plain-text password using bcrypt with automatic salt generation.
   *
   * This method is used during user registration to securely store passwords.
   * Each call generates a unique salt and hash, so the same password produces
   * different hashes (idempotency not guaranteed by design).
   *
   * @param {string | Buffer} data - The plain-text password to hash.
   *                                 Can be a string or Buffer.
   *
   * @returns {Promise<string>} A bcrypt hash string (typically 60 characters)
   *          that can be safely stored in the database and later compared
   *          against user-provided passwords.
   *
   * @throws {Error} If bcrypt operations fail (rare, usually indicates
   *         system resource issues).
   *
   * @example
   * // Hash a password during user registration
   * const plainPassword = 'SecurePassword123!';
   * const hashedPassword = await provider.hashPassword(plainPassword);
   * // Store hashedPassword in database
   *
   * @remarks
   * - Each hash is unique even for identical input (thanks to unique salt)
   * - Hashing is computationally expensive (intentional security feature)
   * - Never compare bcrypt hashes with === operator; use comparePassword
   */
  async hashPassword(data: string | Buffer): Promise<string> {
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(data.toString(), salt);
    return hashedPassword;
  }

  /**
   * Verifies a plain-text password against a bcrypt hash.
   *
   * This method is used during sign-in to validate that the password entered
   * by the user matches the stored hash. It uses constant-time comparison
   * to prevent timing attacks.
   *
   * @param {string | Buffer} data - The plain-text password provided by the user
   *                                 during sign-in.
   * @param {string} encrypted - The bcrypt hash stored in the database
   *                            (typically from user.password).
   *
   * @returns {Promise<boolean>} True if the passwords match, false otherwise.
   *          Intentionally returns false (not an error) if passwords don't match
   *          to avoid leaking whether a password was close.
   *
   * @throws {Error} If bcrypt operations fail (rare, usually indicates
   *         system resource issues).
   *
   * @example
   * // Verify password during sign-in
   * const userProvidedPassword = 'SecurePassword123!';
   * const storedHash = user.password;
   * const isMatch = await provider.comparePassword(userProvidedPassword, storedHash);
   * if (!isMatch) {
   *   throw new UnauthorizedException('Invalid credentials');
   * }
   *
   * @remarks
   * - Uses constant-time comparison (O(n) where n is hash length)
   * - Always compare with this method, never with === or string comparison
   * - Returns false (not an exception) for non-matching passwords
   */
  async comparePassword(
    data: string | Buffer,
    encrypted: string,
  ): Promise<boolean> {
    const isMatch = await bcrypt.compare(data.toString(), encrypted);
    return isMatch;
  }
}
