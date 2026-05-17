import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { PostsService } from './provider/posts.service';
import { UsersService } from '../users/provider/users.service';
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { CreatePostDto } from './dtos/create-post.dto';
import { PatchPostDto } from './dtos/patch-post.dto';

@Controller('posts')
export class PostsController {
  /**
   *
   */
  constructor(
    private readonly postsService: PostsService,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all posts for a specific user', description: 'Fetch all posts associated with a given user ID' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved posts for the user' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiQuery({
    name: 'userId',
    type: Number,
    description: 'ID of the user to fetch posts for',
  })
  public getAllPosts(@Query('userId', ParseIntPipe) userId: number) {
    return this.postsService.getAllPosts(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new post', description: 'Create a new post using the required structure' })
  @ApiResponse({ status: 201, description: 'Post created successfully' })
  @ApiBody({ type: CreatePostDto })
  public createPost(@Body() createPostDto: CreatePostDto) {
    return this.postsService.createPost(createPostDto);
  }

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
