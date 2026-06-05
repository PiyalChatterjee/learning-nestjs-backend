import { IsEnum, IsOptional, IsString } from 'class-validator';
import { SortOrder } from '../enums/sort-order.enum';
import { ApiProperty } from '@nestjs/swagger';

export class SortQueryDto {
  /**
   * Field to sort by.
   */
  @ApiProperty({
    description: 'Field to sort by',
    example: 'createdAt',
    required: false,
  })
  @IsOptional()
  @IsString()
  sortBy?: string;
  /**
   * Sort order: 'asc' for ascending, 'desc' for descending.
   * Defaults to 'desc' if not provided.
   * Validation ensures only 'asc' or 'desc' values are accepted.
   * This field is optional, allowing for default sorting behavior when not specified.
   */
  @ApiProperty({
    description: "Sort order: 'asc' for ascending, 'desc' for descending",
    example: 'desc',
    required: false,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.Descending;
}
