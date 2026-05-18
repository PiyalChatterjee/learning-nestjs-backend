import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { PostsService } from './provider/posts.service';
import { UsersService } from '../users/provider/users.service';
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { CreatePostDto } from './dtos/create-post.dto';
import { PatchPostDto } from './dtos/patch-post.dto';

/**
 * Handles HTTP routes for post retrieval and mutation.
 */
@Controller('posts')
export class PostsController {
  /**
   *
   */
  constructor(
    private readonly postsService: PostsService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Returns all posts from the database.
   */
  @Get()
  @ApiOperation({ summary: 'Get all posts', description: 'Fetch all posts from the database' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved all posts' })
  public getAllPosts() {
    return this.postsService.getAllPosts();
  }

  /**
   * Creates a new post from the provided payload.
   */
  @Post()
  @ApiOperation({ summary: 'Create a new post', description: 'Create a new post using the required structure' })
  @ApiResponse({ status: 201, description: 'Post created successfully' })
  @ApiBody({ type: CreatePostDto })
  public createPost(@Body() createPostDto: CreatePostDto) {
    return this.postsService.createPost(createPostDto);
  }

  /**
   * Applies partial updates to an existing post.
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Update a post', description: 'Update an existing post by its ID' })
  @ApiResponse({ status: 200, description: 'Post updated successfully' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID of the post to update',
  })
  @ApiBody({ type: PatchPostDto, description: 'Data transfer object for updating a post' })
  public updatePost(@Param('id', ParseIntPipe) postId: number, @Body() patchPostDto: PatchPostDto) {
    return this.postsService.patchPost(postId, patchPostDto);
  }
}
