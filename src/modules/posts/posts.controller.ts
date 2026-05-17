import { Body, Controller, Get, ParseIntPipe, Post, Query } from '@nestjs/common';
import { PostsService } from './provider/posts.service';
import { UsersService } from '../users/provider/users.service';
import { ApiBody, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { CreatePostDto } from './dtos/create-post.dto';

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
}
