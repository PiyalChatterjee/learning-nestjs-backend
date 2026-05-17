import { Injectable } from '@nestjs/common';
import { UsersService } from '../../users/provider/users.service';

@Injectable()
export class PostsService {
  /**
   *Injecting UsersService to fetch user details for the posts
   */
  constructor(private readonly usersService: UsersService) {}
  public getAllPosts(userId: number) {
    const user = this.usersService.getUserById(userId);
    return [
      {
        id: userId,
        title: 'First Post',
        content: 'This is the content of the first post',
        author: user,
      },
    ];
  }
}
