import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GoogleTokenDto {
  @ApiProperty({
    description: 'Google OAuth token obtained from the client',
    example: '<token>',
  })
  @IsNotEmpty()
  @IsString()
  token: string;
}
