import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, ValidateNested } from 'class-validator';
import { CreatePostDto } from './create-post.dto';
import { Type } from 'class-transformer';

/**
 * Represents the payload required to create multiple posts in a single bulk operation.
 */
export class CreateManyPostsDto {
  /**
   * Array of post creation data transfer objects.
   * Each DTO is validated individually and the entire batch is persisted atomically.
   */
  @ApiProperty({
    description: 'Array of post creation data transfer objects',
    type: [CreatePostDto],
    required: true,
    example: [
      {
        title: 'Getting started with NestJS',
        slug: 'getting-started-with-nestjs',
        postType: 'POST',
        status: 'DRAFT',
        content: 'Learn the basics of NestJS...',
        authorEmail: 'john@example.com',
        tags: ['nestjs', 'backend'],
      },
      {
        title: 'Advanced NestJS patterns',
        slug: 'advanced-nestjs-patterns',
        postType: 'POST',
        status: 'DRAFT',
        content: 'Deep dive into NestJS patterns...',
        authorEmail: 'jane@example.com',
        tags: ['nestjs', 'advanced'],
      },
    ],
  })
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePostDto)
  posts: CreatePostDto[];
}
