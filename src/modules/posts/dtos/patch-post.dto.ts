import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsArray,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  ValidateNested,
} from 'class-validator';
import { CreatePostDto } from './create-post.dto';
import { Type } from 'class-transformer';
import { PostStatus } from '../enums/post-status.enum';
import { PostType } from '../enums/post-type.enum';
import { PostMetaOptionDto } from './post-meta-options.dto';

export class PatchPostDto extends PartialType(CreatePostDto) {
  @ApiPropertyOptional({
    description: 'Title of the post',
    example: 'Getting started with NestJS',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    description: 'Type of post content',
    enum: PostType,
    example: PostType.POST,
  })
  @IsEnum(PostType)
  postType: PostType;

  @ApiPropertyOptional({
    description: 'URL-friendly unique slug',
    example: 'getting-started-with-nestjs',
  })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiPropertyOptional({
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

  @ApiPropertyOptional({
    description: 'Scheduled publish date',
    example: '2026-06-01T10:00:00.000Z',
  })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  publishOn?: Date;

  @ApiPropertyOptional({
    description: 'List of tags associated with the post',
    type: [String],
    example: ['nestjs', 'backend', 'typescript'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Additional metadata options',
    type: [PostMetaOptionDto],
    example: [
      {
        key: 'canonicalUrl',
        value: 'https://example.com/posts/getting-started-with-nestjs',
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PostMetaOptionDto)
  @IsOptional()
  metaOptions?: PostMetaOptionDto[];
}
