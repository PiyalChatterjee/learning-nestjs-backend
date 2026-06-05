import {
  IsDate,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationQueryDto } from '../../../common/paginations/dtos/pagination-query.dto';
import { SortQueryDto } from '../../../common/paginations/dtos/sort-query.dto';
import { ApiPropertyOptional, IntersectionType } from '@nestjs/swagger';
import { PostStatus } from '../enums/post-status.enum';

class GetPostsBaseDto {
  /**
   * Start date for filtering posts (inclusive).
   */
  @ApiPropertyOptional({
    description: 'Start date for filtering posts (inclusive)',
    example: '2026-01-01T00:00:00Z',
    type: 'string',
    format: 'date-time',
  })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  startDate?: Date;

  /**
   * End date for filtering posts (inclusive).
   */
  @ApiPropertyOptional({
    description: 'End date for filtering posts (inclusive)',
    example: '2026-12-31T23:59:59Z',
    type: 'string',
    format: 'date-time',
  })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  endDate?: Date;

  /**
   * Filter posts by lifecycle status.
   */
  @ApiPropertyOptional({
    description: 'Publishing lifecycle status to filter by',
    enum: PostStatus,
    example: PostStatus.DRAFT,
  })
  @IsOptional()
  @IsEnum(PostStatus)
  status?: PostStatus;

  /**
   * Keyword to search within post titles (case-insensitive partial match).
   */
  @ApiPropertyOptional({
    description:
      'Keyword to search within post titles (case-insensitive partial match)',
    example: 'nestjs',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;
}

export class GetPostsDto extends IntersectionType(
  GetPostsBaseDto,
  PaginationQueryDto,
  SortQueryDto,
) {}
