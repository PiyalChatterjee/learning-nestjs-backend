import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token issued to the user',
    example: '<refresh_token>',
  })
  @IsNotEmpty()
  @IsString()
  refreshToken: string;
}
