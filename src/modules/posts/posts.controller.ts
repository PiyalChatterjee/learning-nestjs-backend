import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { PostsService } from './providers/posts.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { CreatePostDto } from './dtos/create-post.dto';
import { CreateManyPostsDto } from './dtos/create-many-posts.dto';
import { PatchPostDto } from './dtos/patch-post.dto';
import { UpdatePostDto } from './dtos/update-post.dto';
import { GetPostsDto } from './dtos/get-posts.dto';
import { ActiveUser } from '../auth/decorators/active-user.decorator';
import { IActiveUser } from '../auth/interfaces/active-user.interface';

/**
 * Handles HTTP routes for post retrieval and mutation.
 */
@ApiBearerAuth('access-token')
@Controller('posts')
export class PostsController {
  /**
   * Creates PostsController dependencies.
   * @param postsService - Service that handles post business operations.
   */
  constructor(private readonly postsService: PostsService) {}

  /**
   * Returns all posts from the database.
   */
  @Get()
  @ApiOperation({
    summary: 'Get all posts',
    description: 'Fetch all posts from the database',
  })
  @ApiResponse({ status: 200, description: 'Successfully retrieved all posts' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number for pagination (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of posts per page for pagination (default: 10)',
  })
  public getAllPosts(@Query() getPostsDto: GetPostsDto) {
    return this.postsService.getAllPosts(getPostsDto);
  }

  /**
   * Returns one post by id.
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get post by id',
    description: 'Fetch one post by its ID',
  })
  @ApiResponse({ status: 200, description: 'Successfully retrieved post' })
  @ApiResponse({ status: 400, description: 'Invalid post id' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID of the post to fetch',
  })
  public getPostById(@Param('id', ParseIntPipe) postId: number) {
    return this.postsService.getPostById(postId);
  }

  /**
   * Creates a new post from the provided payload.
   */
  @Post()
  @ApiOperation({
    summary: 'Create a new post',
    description: 'Create a new post using the required structure',
  })
  @ApiResponse({ status: 201, description: 'Post created successfully' })
  @ApiResponse({
    status: 400,
    description: 'Validation failed for request payload',
  })
  @ApiResponse({
    status: 404,
    description: 'Author not found for authenticated user token',
  })
  @ApiBody({ type: CreatePostDto })
  public createPost(
    @Body() createPostDto: CreatePostDto,
    @ActiveUser() activeUser: IActiveUser,
  ) {
    return this.postsService.createPost(createPostDto, activeUser);
  }

  /**
   * Creates multiple posts in a single atomic transaction for the authenticated user.
   */
  @Post('create-many')
  @ApiOperation({
    summary: 'Create multiple posts in bulk',
    description:
      'Create multiple posts in a single atomic transaction. All posts are validated and persisted together, or all are rolled back on any error.',
  })
  @ApiResponse({ status: 201, description: 'Posts created successfully' })
  @ApiResponse({
    status: 400,
    description:
      'Validation failed (batch too large, empty batch, duplicate slugs, or invalid post data)',
  })
  @ApiResponse({
    status: 404,
    description: 'Author not found for authenticated user token',
  })
  @ApiResponse({ status: 409, description: 'Duplicate slug conflict' })
  @ApiBody({ type: CreateManyPostsDto })
  public createManyPosts(
    @Body() createManyPostsDto: CreateManyPostsDto,
    @ActiveUser() activeUser: IActiveUser,
  ) {
    return this.postsService.createManyPosts(createManyPostsDto, activeUser);
  }

  /**
   * Replaces an existing post using a full payload.
   */
  @Put(':id')
  @ApiOperation({
    summary: 'Replace a post',
    description: 'Fully replace an existing post by its ID',
  })
  @ApiResponse({ status: 200, description: 'Post replaced successfully' })
  @ApiResponse({
    status: 400,
    description: 'Invalid post id or request payload',
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID of the post to replace',
  })
  @ApiBody({
    type: UpdatePostDto,
    description: 'Data transfer object for fully updating a post',
  })
  public replacePost(
    @Param('id', ParseIntPipe) postId: number,
    @Body() updatePostDto: UpdatePostDto,
  ) {
    return this.postsService.updatePost(postId, updatePostDto);
  }

  /**
   * Applies partial updates to an existing post.
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'Update a post',
    description: 'Update an existing post by its ID',
  })
  @ApiResponse({ status: 200, description: 'Post updated successfully' })
  @ApiResponse({
    status: 400,
    description: 'Invalid post id or request payload',
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID of the post to update',
  })
  @ApiBody({
    type: PatchPostDto,
    description: 'Data transfer object for updating a post',
  })
  public updatePost(
    @Param('id', ParseIntPipe) postId: number,
    @Body() patchPostDto: PatchPostDto,
  ) {
    return this.postsService.patchPost(postId, patchPostDto);
  }

  /**
   * Deletes a post by id.
   */
  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a post',
    description: 'Delete an existing post by its ID',
  })
  @ApiResponse({ status: 200, description: 'Post deleted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid post id' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID of the post to delete',
  })
  public deletePost(@Param('id', ParseIntPipe) postId: number) {
    return this.postsService.deletePost(postId);
  }
}
