import { PartialType } from '@nestjs/swagger';
import { CreatePostDto } from './create-post.dto';

/**
 * Partial payload used to update an existing post.
 */
export class PatchPostDto extends PartialType(CreatePostDto) {}
