import { OmitType } from '@nestjs/swagger';
import { CreatePostDto } from './create-post.dto';

/**
 * Full payload used to replace an existing post.
 */
export class UpdatePostDto extends OmitType(CreatePostDto, [] as const) {}
