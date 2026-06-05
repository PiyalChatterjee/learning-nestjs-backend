import { ApiPropertyOptional, IntersectionType } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../../common/paginations/dtos/pagination-query.dto';
import { SortQueryDto } from '../../../common/paginations/dtos/sort-query.dto';

class GetUsersBaseDto {
  /**
   * Keyword to search within user names or email (case-insensitive partial match).
   */
  @ApiPropertyOptional({
    description: 'Keyword to search within user first name (case-insensitive partial match)',
    example: 'john',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;
}

export class GetUsersDto extends IntersectionType(GetUsersBaseDto, PaginationQueryDto, SortQueryDto) {}
