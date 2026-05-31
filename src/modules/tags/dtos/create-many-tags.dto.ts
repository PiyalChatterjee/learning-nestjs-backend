import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, ValidateNested } from 'class-validator';
import { PostTagDto } from './post-tag.dto';
import { Type } from 'class-transformer';

/**
 * Represents the payload required to create multiple tags in a single bulk operation.
 */
export class CreateManyTagsDto {
  /**
   * Array of tag creation data transfer objects.
   * Each DTO is validated individually and the entire batch is persisted atomically.
   */
  @ApiProperty({
    description: 'Array of tag creation data transfer objects',
    type: [PostTagDto],
    required: true,
    example: [
      {
        name: 'nestjs',
        slug: 'nestjs',
        description: 'NestJS framework posts',
      },
      {
        name: 'backend',
        slug: 'backend',
        description: 'Backend development posts',
      },
      {
        name: 'typescript',
        slug: 'typescript',
        description: 'TypeScript language posts',
      },
    ],
  })
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PostTagDto)
  tags: PostTagDto[];
}
