import { PartialType } from '@nestjs/swagger';
import { UpdatePostDto } from './update-post.dto';

/**
 * Partial payload used to update an existing post.
 */
export class PatchPostDto extends PartialType(UpdatePostDto) {}
