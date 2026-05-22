import { Body, Controller, Post } from '@nestjs/common';
import { PostMetaOptionDto } from './dtos/post-meta-options.dto';
import { MetaOptionsService } from './provider/meta-options.service';

@Controller('meta-options')
export class MetaOptionsController {
  constructor(
    /**
     * Inject the MetaOptionsService to handle business logic related to meta options.
     * This service will be responsible for creating meta options and any other related operations.
     */
    private readonly metaOptionsService: MetaOptionsService,
  ) {}
  @Post()
  public createMetaOption(@Body() postMetaOptionDto: PostMetaOptionDto) {
    return this.metaOptionsService.createMetaOption(postMetaOptionDto);
  }
}
