import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { UpdateUserDto } from './update-user.dto';

export class PatchUserDto extends PartialType(UpdateUserDto) {}
