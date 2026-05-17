import { PartialType } from '@nestjs/mapped-types';
import { UpdateUserDto } from './update-user.dto';

export class PatchUserDto extends PartialType(UpdateUserDto) {}