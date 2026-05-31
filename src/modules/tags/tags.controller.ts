import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { TagsService } from './providers/tags.service';
import { PostTagDto } from './dtos/post-tag.dto';
import { CreateManyTagsDto } from './dtos/create-many-tags.dto';
import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { formatTag } from '../../helpers/format-tag.helper';
import { formatPostSummary } from '../../helpers/format-post-summary.helper';

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
   * Creates multiple tags in a single atomic transaction.
   */
  @Post('create-many')
  @ApiOperation({
    summary: 'Create multiple tags in bulk',
    description: 'Create multiple tags in a single atomic transaction. All tags are validated and persisted together, or all are rolled back on any error.',
  })
  @ApiResponse({ status: 201, description: 'Tags created successfully' })
  @ApiResponse({
    status: 400,
    description: 'Validation failed (batch too large, empty batch, duplicate slugs, or invalid tag data)',
  })
  @ApiResponse({ status: 409, description: 'Duplicate slug conflict' })
  @ApiBody({ type: CreateManyTagsDto })
  public async createManyTags(@Body() createManyTagsDto: CreateManyTagsDto) {
    const tags = await this.tagsService.createManyTags(createManyTagsDto);
    return tags.map(formatTag);
  }

  /**
   * Returns all tags in formatted output shape.
   */
  @Get()
  public async getAllTags() {
    const tags = await this.tagsService.getAllTags();
    return tags.map(formatTag);
  }

  /**
   * Returns a single tag with all associated posts.
   */
  @Get(':id')
  public async getTagWithPosts(@Param('id', ParseIntPipe) id: number) {
    const { tag, posts } = await this.tagsService.getTagWithPosts(id);
    return {
      ...formatTag(tag),
      posts: posts.map(formatPostSummary),
    };
  }

  /**
   * Soft-deletes a tag by id.
   */
  @Delete(':id')
  public async deleteTag(@Param('id', ParseIntPipe) id: number) {
    return this.tagsService.deleteTag(id);
  }
}
