import { Body, Controller, Post } from '@nestjs/common';
import { PostMetaOptionDto } from './dtos/post-meta-options.dto';
import { MetaOptionsService } from './provider/meta-options.service';

/**
 * Handles HTTP endpoints for metadata options.
 */
@Controller('meta-options')
export class MetaOptionsController {
  constructor(
    /**
     * Inject the MetaOptionsService to handle business logic related to meta options.
     * This service will be responsible for creating meta options and any other related operations.
     */
    private readonly metaOptionsService: MetaOptionsService,
  ) {}

  /**
   * Creates a metadata option record.
   */
  @Post()
  public createMetaOption(@Body() postMetaOptionDto: PostMetaOptionDto) {
    return this.metaOptionsService.createMetaOption(postMetaOptionDto);
  }
}
