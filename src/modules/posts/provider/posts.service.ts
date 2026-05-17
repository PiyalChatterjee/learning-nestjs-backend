import { Injectable } from '@nestjs/common';
import { UsersService } from '../../users/provider/users.service';
import { CreatePostDto } from '../dtos/create-post.dto';
import { PatchPostDto } from '../dtos/patch-post.dto';
import { assertResourceExists } from '../../../common/exceptions/not-found.helper';

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

  public patchPost(postId: number, patchPostDto: PatchPostDto) {
    const postIndex = this.posts.findIndex((post) => post.id === postId);
    const existingPost = assertResourceExists(this.posts[postIndex], 'Post', postId);

    const updatedPost = {
      ...existingPost,
      ...patchPostDto,
    };
    this.posts[postIndex] = updatedPost;
    return updatedPost;
  }
}
