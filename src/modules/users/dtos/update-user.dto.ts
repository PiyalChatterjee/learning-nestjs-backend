import { ApiProperty, ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

/**
 * Defines full update payload for an existing user.
 */
export class UpdateUserDto extends OmitType(CreateUserDto, [
  'password',
] as const) {}
