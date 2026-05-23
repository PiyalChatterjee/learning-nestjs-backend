import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsJSON } from 'class-validator';

/**
 * Payload used to create or update post metadata options.
 */
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
