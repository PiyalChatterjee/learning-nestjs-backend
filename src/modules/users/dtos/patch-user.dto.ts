import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { UpdateUserDto } from './update-user.dto';

/**
 * Defines partial update payload for a user.
 */
export class PatchUserDto extends PartialType(UpdateUserDto) {}
