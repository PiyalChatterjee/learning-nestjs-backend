import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class PostMetaOptionDto {
  @ApiProperty({
    description: 'Metadata key',
    example: 'seoTitle',
  })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty({
    description: 'Metadata value',
    example: 'How to build APIs with NestJS',
  })
  @IsString()
  @IsNotEmpty()
  value: string;
}
