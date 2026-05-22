import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  ValidateNested,
} from 'class-validator';
import { PostStatus } from '../enums/post-status.enum';
import { PostType } from '../enums/post-type.enum';
import { PostMetaOptionDto } from '../../meta-options/dtos/post-meta-options.dto';

/**
 * Represents the payload required to create a post.
 */
export class CreatePostDto {
  /**
   * Human-readable post title.
   */
  @ApiProperty({
    description: 'Title of the post',
    example: 'Getting started with NestJS',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  /**
   * Classification of the post content.
   */
  @ApiProperty({
    description: 'Type of post content',
    enum: PostType,
    example: PostType.POST,
  })
  @IsEnum(PostType)
  postType: PostType;

  /**
   * URL-friendly unique identifier for the post.
   */
  @ApiProperty({
    description: 'URL-friendly unique slug',
    example: 'getting-started-with-nestjs',
  })
  @IsString()
  @IsNotEmpty()
  slug: string;

  /**
   * Workflow status used in publication lifecycle.
   */
  @ApiProperty({
    description: 'Publishing lifecycle status',
    enum: PostStatus,
    example: PostStatus.DRAFT,
  })
  @IsEnum(PostStatus)
  status: PostStatus;

  /**
   * Optional body content for the post.
   */
  @ApiPropertyOptional({
    description: 'Post body content',
    example: 'This is the full content of the post.',
  })
  @IsOptional()
  @IsString()
  content?: string;

  /**
   * Optional schema identifier related to the post.
   */
  @ApiPropertyOptional({
    description: 'Schema type associated with content',
    example: 'article',
  })
  @IsOptional()
  @IsString()
  schema?: string;

  /**
   * Optional URL for the featured image.
   */
  @ApiPropertyOptional({
    description: 'Featured image URL',
    example: 'https://example.com/images/post-cover.png',
  })
  @IsOptional()
  @IsUrl()
  featuredImageUrl?: string;

  /**
   * Scheduled publish date and time.
   */
  @ApiProperty({
    description: 'Scheduled publish date',
    example: '2026-06-01T10:00:00.000Z',
  })
  @Type(() => Date)
  @IsDate()
  publishOn: Date;

  /**
   * Tags assigned to the post.
   */
  @ApiProperty({
    description: 'List of tags associated with the post',
    type: [String],
    example: ['nestjs', 'backend', 'typescript'],
  })
  @IsArray()
  @IsString({ each: true })
  tags: string[];

  /**
   * Optional metadata for the post stored as a JSON string.
   */
  @ApiPropertyOptional({
    description: 'Additional metadata as a JSON string',
    type: PostMetaOptionDto,
    example: {
      metaValue: '{"canonicalUrl": "https://example.com/posts/getting-started-with-nestjs"}',
    },
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PostMetaOptionDto)
  metaOption?: PostMetaOptionDto;

  /**
   * Email of the user authoring this post.
   */
  @ApiProperty({
    description: 'Email address of the post author',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  authorEmail: string;
}
