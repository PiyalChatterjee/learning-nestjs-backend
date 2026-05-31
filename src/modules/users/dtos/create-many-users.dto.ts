import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, ValidateNested } from 'class-validator';
import { CreateUserDto } from './create-user.dto';
import { Type } from 'class-transformer';

/**
 * Represents the payload required to create multiple users in a single bulk operation.
 */
export class CreateManyUsersDto {
  /**
   * Array of user creation data transfer objects.
   * Each DTO is validated individually and the entire batch is persisted atomically.
   */
  @ApiProperty({
    description: 'Array of user creation data transfer objects',
    type: [CreateUserDto],
    required: true,
    example: [
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'P@ssw0rd!',
      },
      {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        password: 'P@ssw0rd!',
      },
    ],
  })
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateUserDto)
  users: CreateUserDto[];
}
