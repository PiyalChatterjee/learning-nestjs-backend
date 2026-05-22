import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePostDto } from '../dtos/create-post.dto';
import { PatchPostDto } from '../dtos/patch-post.dto';
import { UpdatePostDto } from '../dtos/update-post.dto';
import { assertResourceExists } from '../../../common/exceptions/not-found.helper';
import { InjectRepository } from '@nestjs/typeorm';
import { Post } from '../post.entity';
import { User } from '../../users/user.entity';
import { Repository } from 'typeorm';
import { formatPostWithAuthor } from '../../../helpers/format-post-with-author.helper';

/**
 * Manages post data operations.
 */
@Injectable()
export class PostsService {
  /**
   * Inject Post Repository to manage post data persistence and retrieval from the database.
   * Inject User Repository to look up authors by email when creating posts.
   */
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Returns all posts stored in the database.
   */
  public async getAllPosts() {
    // fetch all posts from the database
    const posts = await this.postRepository.find({
      relations: ['author'],
    });

    // format posts with author details
    return posts.map((post) => formatPostWithAuthor(post));
  }

  /**
   * Returns one post by id.
   */
  public async getPostById(postId: number) {
    // fetch the post or throw 404 if not found
    const post = assertResourceExists(
      await this.postRepository.findOne({
        where: { id: postId },
        relations: ['author'],
      }),
      'Post',
      postId,
    );

    return formatPostWithAuthor(post);
  }

  /**
   * Creates and stores a new post.
   */
  public async createPost(createPostDto: CreatePostDto) {
    // look up the author by email
    const author = await this.userRepository.findOne({
      where: { email: createPostDto.authorEmail },
    });
    if (!author) {
      throw new NotFoundException(
        `Author with email ${createPostDto.authorEmail} not found`,
      );
    }

    // extract authorEmail and metaOption from DTO
    const { authorEmail, metaOption, ...postData } = createPostDto;

    // create post with author relation and metaOption relationship
    const post = this.postRepository.create({
      ...postData,
      metaValue: (metaOption as unknown as typeof post.metaValue) ?? undefined,
    });
    post.author = author;

    // persist the post to the database
    await this.postRepository.save(post);

    // return formatted response with author details
    return formatPostWithAuthor(post);
  }

  /**
   * Replaces an existing post with a full payload.
   */
  public async updatePost(postId: number, updatePostDto: UpdatePostDto) {
    // fetch the post or throw 404 if not found
    const post = assertResourceExists(
      await this.postRepository.findOne({
        where: { id: postId },
        relations: ['author'],
      }),
      'Post',
      postId,
    );

    // replace all mutable fields from full update payload
    const { metaOption, ...postData } = updatePostDto;
    Object.assign(post, {
      ...postData,
      metaValue: (metaOption as unknown as typeof post.metaValue) ?? post.metaValue,
    });

    await this.postRepository.save(post);

    return formatPostWithAuthor(post);
  }

  /**
   * Updates an existing post using a partial payload.
   */
  public async patchPost(postId: number, patchPostDto: PatchPostDto) {
    // fetch the post or throw 404 if not found
    const post = assertResourceExists(
      await this.postRepository.findOne({ where: { id: postId } }),
      'Post',
      postId,
    );

    // strip undefined fields and merge partial updates
    const partialPayload = Object.fromEntries(
      Object.entries(patchPostDto).filter(([, value]) => value !== undefined),
    );

    Object.assign(post, partialPayload);

    // persist changes to the database
    await this.postRepository.save(post);

    // reload author relation and return formatted response
    const updatedPost = await this.postRepository.findOne({
      where: { id: post.id },
      relations: ['author'],
    });
    return formatPostWithAuthor(updatedPost);
  }

  /**
   * Removes a post by id.
   */
  public async deletePost(postId: number) {
    // fetch the post or throw 404 if not found
    const post = assertResourceExists(
      await this.postRepository.findOne({ where: { id: postId } }),
      'Post',
      postId,
    );

    await this.postRepository.remove(post);

    return {
      message: `Post with id ${postId} deleted successfully`,
    };
  }
}
