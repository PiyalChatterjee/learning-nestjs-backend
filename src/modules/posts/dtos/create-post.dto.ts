import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  ValidateNested,
} from 'class-validator';

export enum PostType {
  POST = 'post',
  PAGE = 'page',
  STORY = 'story',
  SERIES = 'series',
}

export enum PostStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  REVIEW = 'review',
  PUBLISHED = 'published',
}

export class PostMetaOptionDto {
  @ApiProperty({
    description: 'Metadata key',
    example: 'seoTitle',
  })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty({
    description: 'Metadata value',
    example: 'How to build APIs with NestJS',
  })
  @IsString()
  @IsNotEmpty()
  value: string;
}

export class CreatePostDto {
  @ApiProperty({
    description: 'Title of the post',
    example: 'Getting started with NestJS',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Type of post content',
    enum: PostType,
    example: PostType.POST,
  })
  @IsEnum(PostType)
  postType: PostType;

  @ApiProperty({
    description: 'URL-friendly unique slug',
    example: 'getting-started-with-nestjs',
  })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({
    description: 'Publishing lifecycle status',
    enum: PostStatus,
    example: PostStatus.DRAFT,
  })
  @IsEnum(PostStatus)
  status: PostStatus;

  @ApiPropertyOptional({
    description: 'Post body content',
    example: 'This is the full content of the post.',
  })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({
    description: 'Schema type associated with content',
    example: 'article',
  })
  @IsOptional()
  @IsString()
  schema?: string;

  @ApiPropertyOptional({
    description: 'Featured image URL',
    example: 'https://example.com/images/post-cover.png',
  })
  @IsOptional()
  @IsUrl()
  featuredImageUrl?: string;

  @ApiProperty({
    description: 'Scheduled publish date',
    example: '2026-06-01T10:00:00.000Z',
  })
  @Type(() => Date)
  @IsDate()
  publishOn: Date;

  @ApiProperty({
    description: 'List of tags associated with the post',
    type: [String],
    example: ['nestjs', 'backend', 'typescript'],
  })
  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @ApiProperty({
    description: 'Additional metadata options',
    type: [PostMetaOptionDto],
    example: [{ key: 'canonicalUrl', value: 'https://example.com/posts/getting-started-with-nestjs' }],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PostMetaOptionDto)
  metaOptions: PostMetaOptionDto[];
}
