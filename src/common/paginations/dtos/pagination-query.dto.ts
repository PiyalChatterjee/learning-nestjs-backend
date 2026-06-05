import { IsOptional, IsInt, Min, IsPositive, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Standard pagination query contract for list endpoints.
 */
export class PaginationQueryDto {
  /**
   * 1-based page index.
   */
  @ApiPropertyOptional({
    description: 'Page number (1-based index)',
    example: 1,
    minimum: 1,
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  /**
   * Number of records to return per page.
   */
  @ApiPropertyOptional({
    description: 'Number of items to return per page',
    example: 10,
    minimum: 1,
    maximum: 100,
  })
  @Type(() => Number)
  @IsOptional()
  @IsPositive()
  @IsInt()
  @Max(100)
  limit?: number = 10;
}
