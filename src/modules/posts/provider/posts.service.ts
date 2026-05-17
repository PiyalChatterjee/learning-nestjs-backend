import { Injectable } from '@nestjs/common';
import { UsersService } from '../../users/provider/users.service';
import { CreatePostDto } from '../dtos/create-post.dto';

@Injectable()
export class PostsService {
  private readonly posts: Array<CreatePostDto & { id: number }> = [];

  /**
   *Injecting UsersService to fetch user details for the posts
   */
  constructor(private readonly usersService: UsersService) {}

  public getAllPosts(userId: number) {
    const user = this.usersService.getUserById(userId);
    return this.posts.map((post) => ({
      ...post,
      author: user,
    }));
  }

  public createPost(createPostDto: CreatePostDto) {
    const post = {
      id: this.posts.length + 1,
      ...createPostDto,
    };

    this.posts.push(post);
    return post;
  }
}
