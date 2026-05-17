import { PartialType } from '@nestjs/mapped-types';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UpdateUserDto } from './update-user.dto';

export class PatchUserDto extends PartialType(UpdateUserDto) {
  @ApiPropertyOptional({
    description: 'First name of the user',
    example: 'John',
  })
  firstName?: string;

  @ApiPropertyOptional({
    description: 'Last name of the user',
    example: 'Doe',
  })
  lastName?: string;

  @ApiPropertyOptional({
    description: 'Email address of the user',
    example: 'john.doe@example.com',
  })
  email?: string;
}