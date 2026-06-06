import { ApiPropertyOptional, IntersectionType } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../../common/paginations/dtos/pagination-query.dto';
import { SortQueryDto } from '../../../common/paginations/dtos/sort-query.dto';

class GetTagsBaseDto {
  /**
   * Keyword to search within tag names (case-insensitive partial match).
   */
  @ApiPropertyOptional({
    description:
      'Keyword to search within tag names (case-insensitive partial match)',
    example: 'react',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;
}

export class GetTagsDto extends IntersectionType(
  GetTagsBaseDto,
  PaginationQueryDto,
  SortQueryDto,
) {}
