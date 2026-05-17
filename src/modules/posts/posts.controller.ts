import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { PostsService } from './provider/posts.service';
import { UsersService } from '../users/provider/users.service';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

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
  @ApiParam({
    name: 'userId',
    type: Number,
    description: 'ID of the user to fetch posts for',
  })
  public getAllPosts(@Param('userId', ParseIntPipe) userId: number) {
    return this.postsService.getAllPosts(userId);
  }
}
