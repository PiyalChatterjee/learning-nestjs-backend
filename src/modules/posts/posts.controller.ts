import { Controller, Get, Param } from '@nestjs/common';
import { PostsService } from './provider/posts.service';
import { UsersService } from '../users/provider/users.service';

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
  public getAllPosts(@Param('userId') userId: number) {
    return this.postsService.getAllPosts(userId);
  }
}
