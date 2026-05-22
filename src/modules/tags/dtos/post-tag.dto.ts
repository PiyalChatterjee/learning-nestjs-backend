import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class PostTagDto {
  /**
   * Name of the tag.
   * This is a human-readable name for the tag.
   */
  @ApiProperty({
    description: 'Name of the tag',
    example: 'nestjs',
  })
  @IsString()
  @MinLength(3)
  @IsNotEmpty()
  @MaxLength(256)
  name: string;

  /**
   * URL-friendly unique slug for the tag.
   * This is used in URLs and should be unique across all tags.
   */
  @ApiProperty({
    description: 'URL-friendly unique slug for the tag',
    example: 'nestjs',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message:
      'Slug must be URL-friendly (lowercase letters, numbers, and hyphens only)',
  })
  @MaxLength(256)
  @IsUrl()
  slug: string;

  /**
   * Optional description of the tag.
   * This can provide additional context about the tag.
   */
  @ApiProperty({
    description: 'Optional description of the tag',
    example:
      'A framework for building efficient, scalable Node.js server-side applications',
    required: false,
  })
  @IsString()
  @MaxLength(1024)
  @IsOptional()
  description?: string;

  /**
   * Optional schema for additional tag metadata.
   * This can be used to store structured data related to the tag.
   */
  @ApiProperty({
    description: 'Optional schema for additional tag metadata',
    example: '{"color": "blue", "icon": "nestjs-icon.png"}',
    required: false,
  })
  @IsString()
  @MaxLength(1024)
  @IsOptional()
  schema?: string;

  /**
   * Optional URL for the feature image of the tag.
   * This can be used to visually represent the tag in the UI.
   */
  @ApiProperty({
    description: 'Optional URL for the feature image of the tag',
    example: 'https://example.com/images/nestjs-tag.png',
    required: false,
  })
  @IsString()
  @MaxLength(1024)
  @IsOptional()
  @IsUrl()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message:
      'Feature image URL must be URL-friendly (lowercase letters, numbers, and hyphens only)',
  })
  featureImageUrl?: string;
}
