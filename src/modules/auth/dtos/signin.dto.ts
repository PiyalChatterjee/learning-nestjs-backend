import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

/**
 * Data Transfer Object for user sign-in (authentication) requests.
 *
 * Encapsulates the credentials required to authenticate a user and receive
 * an access token for subsequent authenticated requests.
 *
 * @class SignInDto
 */
export class SignInDto {
  /**
   * The user's registered email address.
   *
   * Must be a valid email format as per RFC 5322 specification.
   * Email uniqueness is enforced at the user creation level.
   *
   * @type {string}
   * @example 'john.doe@example.com'
   */
  @ApiProperty({
    description: 'Email address of the user',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  /**
   * The user's account password in plain text.
   *
   * Must match the hashed password stored in the database.
   * The password is validated against bcrypt hashes during authentication.
   * Should be sent via HTTPS to ensure confidentiality in transit.
   *
   * @type {string}
   * @example 'P@ssw0rd!'
   */
  @ApiProperty({
    description: 'Password of the user',
    example: 'P@ssw0rd!',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
