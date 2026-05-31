import { IsDate, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../common/paginations/dtos/pagination-query.dto';
import { IntersectionType } from '@nestjs/swagger';

class GetPostsBaseDto {
  @IsDate()
  @IsOptional()
  startDate?: Date;

  @IsDate()
  @IsOptional()
  endDate?: Date;
}

export class GetPostsDto extends IntersectionType(GetPostsBaseDto, PaginationQueryDto) {}