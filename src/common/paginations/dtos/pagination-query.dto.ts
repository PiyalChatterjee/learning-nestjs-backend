import { IsOptional, IsInt, Min, IsPositive, Max } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Standard pagination query contract for list endpoints.
 */
export class PaginationQueryDto {
  /**
   * 1-based page index.
   */
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  /**
   * Number of records to return per page.
   */
  @Type(() => Number)
  @IsOptional()
  @IsPositive()
  @IsInt()
  @Max(100)
  limit?: number = 10;
}
