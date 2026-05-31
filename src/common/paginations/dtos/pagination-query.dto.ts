import { IsOptional, IsInt, Min, IsPositive, Max } from 'class-validator';
import { Type } from 'class-transformer';


export class PaginationQueryDto {
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @Type(() => Number)
  @IsOptional()
  @IsPositive()
  @IsInt()
  @Max(100)
  limit?: number = 10;
}
