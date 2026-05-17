import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

/**
 * Represents a single metadata key-value pair for a post.
 */
export class PostMetaOptionDto {
  /**
   * Metadata key name.
   */
  @ApiProperty({
    description: 'Metadata key',
    example: 'seoTitle',
  })
  @IsString()
  @IsNotEmpty()
  key: string;

  /**
   * Metadata value content.
   */
  @ApiProperty({
    description: 'Metadata value',
    example: 'How to build APIs with NestJS',
  })
  @IsString()
  @IsNotEmpty()
  value: string;
}
