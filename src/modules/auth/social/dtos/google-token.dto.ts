import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * Data Transfer Object for Google OAuth authentication requests.
 *
 * Contains the Google ID token obtained from the client-side Google authentication flow,
 * which is then verified server-side against Google's public keys.
 */
export class GoogleTokenDto {
  @ApiProperty({
    description: 'Google OAuth token obtained from the client',
    example: '<token>',
  })
  @IsNotEmpty()
  @IsString()
  token: string;
}
