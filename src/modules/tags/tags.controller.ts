import { Body, Controller, Get, Post } from '@nestjs/common';
import { TagsService } from './providers/tags.service';
import { PostTagDto } from './dtos/post-tag.dto';
import { formatTag } from '../../helpers/format-tag.helper';

/**
 * Handles HTTP operations for tags.
 */
@Controller('tags')
export class TagsController {
  constructor(
    /**
     * Inject the TagsService to handle business logic related to tags.
     * This service will be responsible for creating tags and any other related operations.
     */
    private readonly tagsService: TagsService,
  ) {}

  /**
   * Creates a tag and returns formatted output.
   */
  @Post()
  public async createTag(@Body() postTagDto: PostTagDto) {
    const tag = await this.tagsService.createTag(postTagDto);
    return formatTag(tag);
  }

  /**
   * Returns all tags in formatted output shape.
   */
  @Get()
  public async getAllTags() {
    const tags = await this.tagsService.getAllTags();
    return tags.map(formatTag);
  }
}
