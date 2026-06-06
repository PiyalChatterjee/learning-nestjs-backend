import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * Data Transfer Object for token refresh requests.
 * 
 * Used to exchange an existing refresh token for a new access token,
 * allowing users to maintain their session without re-authenticating.
 */
export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token issued to the user',
    example: '<refresh_token>',
  })
  @IsNotEmpty()
  @IsString()
  refreshToken: string;
}
