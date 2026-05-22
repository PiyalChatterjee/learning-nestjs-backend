import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsJSON } from 'class-validator';

export class PostMetaOptionDto {
  /**
   * Metadata key Json.
   */
  @ApiProperty({
    description: 'Metadata key-Value Json',
    example: '{"key": "value"}',
  })
  @IsJSON()
  @IsNotEmpty()
  metaValue: string;
}
