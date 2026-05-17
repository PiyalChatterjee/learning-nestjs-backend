import { Injectable } from '@nestjs/common';
import { UsersService } from '../../users/provider/users.service';
import { CreatePostDto } from '../dtos/create-post.dto';
import { PatchPostDto } from '../dtos/patch-post.dto';
import { assertResourceExists } from '../../../common/exceptions/not-found.helper';

/**
 * Manages post data operations.
 */
@Injectable()
export class PostsService {
  /**
   * In-memory post store for learning purposes.
   */
  private readonly posts: Array<CreatePostDto & { id: number }> = [];

  /**
   *Injecting UsersService to fetch user details for the posts
   */
  constructor(private readonly usersService: UsersService) {}

  /**
   * Returns all stored posts with user information attached.
   */
  public getAllPosts(userId: number) {
    const user = this.usersService.getUserById(userId);
    return this.posts.map((post) => ({
      ...post,
      author: user,
    }));
  }

  /**
   * Creates and stores a new post.
   */
  public createPost(createPostDto: CreatePostDto) {
    const post = {
      id: this.posts.length + 1,
      ...createPostDto,
    };

    this.posts.push(post);
    return post;
  }

  /**
   * Updates an existing post using a partial payload.
   */
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
