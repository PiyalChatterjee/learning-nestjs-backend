import { Injectable } from '@nestjs/common';
import { CreatePostDto } from '../dtos/create-post.dto';
import { PatchPostDto } from '../dtos/patch-post.dto';
import { UpdatePostDto } from '../dtos/update-post.dto';
import { CreateManyPostsDto } from '../dtos/create-many-posts.dto';
import { assertResourceExists } from '../../../common/exceptions/not-found.helper';
import { throwIfUniqueConstraintViolation } from '../../../common/exceptions/unique-constraint.helper';
import { throwIfRequestTimeout } from '../../../common/exceptions/request-timeout.helper';
import { throwIfServiceUnavailable } from '../../../common/exceptions/service-unavailable.helper';
import { throwIfUnexpectedError } from '../../../common/exceptions/internal-error.helper';
import { TagRelationValidator } from '../../../common/validators/tag-relation.validator';
import { PostCreateManyProvider } from './post-create-many.provider';
import { InjectRepository } from '@nestjs/typeorm';
import { Post } from '../post.entity';
import { User } from '../../users/user.entity';
import { Repository } from 'typeorm';
import { formatPostWithAuthor } from '../../../helpers/format-post-with-author.helper';
import { MetaOption } from '../../meta-options/meta-option.entity';
import { GetPostsDto } from '../dtos/get-posts.dto';
import { PaginationProvider } from '../../../common/paginations/provider/pagination.provider';
import { IPaginated } from '../../../common/paginations/interfaces/paginated.interface';
import { TDeleteResult } from '../../../common/types/delete-result.type';
import { IActiveUser } from '../../auth/interfaces/active-user.interface';
import { CreatePostProvider, TFormattedPost } from './create-post.provider';

/**
 * Manages post data operations.
 */
@Injectable()
export class PostsService {
  /**
   * Creates dependencies for post management operations.
   * @param postRepository Repository for persisting and retrieving post entities.
   * @param userRepository Repository for looking up post authors by email.
   * @param metaOptionRepository Repository for managing post metadata options.
   * @param tagRelationValidator Validator for resolving and validating tag relationships.
   * @param postCreateManyProvider Provider for atomic batch post creation operations.
   * @param paginationProvider Provider for consistent pagination across post queries.
   * @param createPostProvider Provider for single post creation logic, including author resolution and tag handling.
   *   Extracted to keep PostsService focused on orchestration and delegate complex creation logic.
   */
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(MetaOption)
    private readonly metaOptionRepository: Repository<MetaOption>,
    private readonly tagRelationValidator: TagRelationValidator,
    private readonly postCreateManyProvider: PostCreateManyProvider,
    private readonly paginationProvider: PaginationProvider,
    private readonly createPostProvider: CreatePostProvider,
  ) {}

  /**
   * Returns all posts stored in the database.
   */
  public async getAllPosts(
    getPostsDto: GetPostsDto,
  ): Promise<IPaginated<TFormattedPost>> {
    try {
      // fetch all posts from the database using pagination provider
      const posts = await this.paginationProvider.paginateQuery(
        {
          page: getPostsDto.page || 1,
          limit: getPostsDto.limit || 10,
        },
        this.postRepository,
        {
          order: { id: 'DESC' },
        },
      );

      // return paginated response with each post formatted with author details
      return {
        ...posts,
        data: posts.data.map((post) => formatPostWithAuthor(post)),
      };
    } catch (error) {
      throwIfServiceUnavailable(error, {
        message: 'Cannot fetch posts at this moment',
        serviceName: 'database',
        shouldLog: true,
      });
      throwIfRequestTimeout(error, {
        message: 'Failed to fetch posts',
        context: 'database query',
      });
      throwIfUnexpectedError(error, {
        userMessage: 'Failed to fetch posts',
        context: 'post-fetch-all',
        originalError: error,
      });
      throw error;
    }
  }

  /**
   * Returns one post by id.
   */
  public async getPostById(postId: number): Promise<TFormattedPost> {
    try {
      // fetch the post or throw 404 if not found
      const post = assertResourceExists(
        await this.postRepository.findOne({ where: { id: postId } }),
        'Post',
        postId,
      );

      return formatPostWithAuthor(post);
    } catch (error) {
      throwIfServiceUnavailable(error, {
        message: 'Cannot fetch post at this moment',
        serviceName: 'database',
        shouldLog: true,
      });
      throwIfRequestTimeout(error, {
        message: 'Failed to fetch post',
        context: 'database query',
      });
      throwIfUnexpectedError(error, {
        userMessage: 'Failed to fetch post',
        context: 'post-fetch-by-id',
        originalError: error,
      });
      throw error;
    }
  }

  /**
   * Creates and stores a new post.
   */
  public async createPost(
    createPostDto: CreatePostDto,
    activeUser: IActiveUser,
  ): Promise<TFormattedPost> {
    return this.createPostProvider.createPost(createPostDto, activeUser);
  }

  /**
   * Creates multiple posts in a single atomic transaction.
   * Delegates to PostCreateManyProvider which handles batch validation,
   * author lookup, tag resolution, and transactional persistence.
   * See PostCreateManyProvider for detailed bulk operation semantics.
   */
  public async createManyPosts(
    createManyPostsDto: CreateManyPostsDto,
    activeUser: IActiveUser,
  ): Promise<TFormattedPost[]> {
    const posts = await this.postCreateManyProvider.createManyPosts(
      createManyPostsDto,
      activeUser,
    );
    return posts.map((post) => formatPostWithAuthor(post));
  }

  /**
   * Replaces an existing post with a full payload.
   */
  public async updatePost(
    postId: number,
    updatePostDto: UpdatePostDto,
  ): Promise<TFormattedPost> {
    try {
      // fetch the post or throw 404 if not found
      const post = assertResourceExists(
        await this.postRepository.findOne({ where: { id: postId } }),
        'Post',
        postId,
      );

      // replace all mutable fields from full update payload
      const { metaOption, tags = [], ...postData } = updatePostDto;
      const postTags = await this.tagRelationValidator.resolveTagsOrThrow(tags);
      Object.assign(post, {
        ...postData,
        tags: postTags,
        metaValue:
          (metaOption as unknown as typeof post.metaValue) ?? post.metaValue,
      });
      if (metaOption) {
        if (post.metaValue) {
          Object.assign(post.metaValue, metaOption);
          await this.metaOptionRepository.save(post.metaValue);
        } else {
          post.metaValue = this.metaOptionRepository.create(metaOption);
        }
      }
      await this.postRepository.save(post);

      return formatPostWithAuthor(post);
    } catch (error) {
      throwIfUniqueConstraintViolation(error, {
        message: `Post with slug ${updatePostDto.slug} already exists`,
      });
      throwIfServiceUnavailable(error, {
        message: 'Cannot update post at this moment',
        serviceName: 'database',
        shouldLog: true,
      });
      throwIfRequestTimeout(error, {
        message: 'Failed to update post',
        context: 'database query',
      });
      throwIfUnexpectedError(error, {
        userMessage: 'Failed to update post',
        context: 'post-update',
        originalError: error,
      });
      throw error;
    }
  }

  /**
   * Updates an existing post using a partial payload.
   */
  public async patchPost(
    postId: number,
    patchPostDto: PatchPostDto,
  ): Promise<TFormattedPost> {
    try {
      // fetch the post or throw 404 if not found
      const post = assertResourceExists(
        await this.postRepository.findOne({ where: { id: postId } }),
        'Post',
        postId,
      );

      // strip undefined fields and merge partial updates
      const { metaOption, tags, ...patchPayload } = patchPostDto;
      const partialPayload = Object.fromEntries(
        Object.entries(patchPayload).filter(([, value]) => value !== undefined),
      );

      Object.assign(post, partialPayload);

      if (tags !== undefined) {
        post.tags = await this.tagRelationValidator.resolveTagsOrThrow(tags);
      }

      // persist changes to the database
      if (post.metaValue && metaOption) {
        Object.assign(post.metaValue, metaOption);
        await this.metaOptionRepository.save(post.metaValue);
      } else if (metaOption) {
        post.metaValue = this.metaOptionRepository.create(metaOption);
      }

      await this.postRepository.save(post);

      // reload post to get eager relations after save
      const updatedPost = await this.postRepository.findOne({
        where: { id: post.id },
      });
      return formatPostWithAuthor(updatedPost);
    } catch (error) {
      if (patchPostDto.slug) {
        throwIfUniqueConstraintViolation(error, {
          message: `Post with slug ${patchPostDto.slug} already exists`,
        });
      }
      throwIfServiceUnavailable(error, {
        message: 'Cannot patch post at this moment',
        serviceName: 'database',
        shouldLog: true,
      });
      throwIfRequestTimeout(error, {
        message: 'Failed to patch post',
        context: 'database query',
      });
      throwIfUnexpectedError(error, {
        userMessage: 'Failed to patch post',
        context: 'post-patch',
        originalError: error,
      });
      throw error;
    }
  }

  /**
   * Removes a post by id.
   */
  public async deletePost(postId: number): Promise<TDeleteResult> {
    try {
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
    } catch (error) {
      throwIfServiceUnavailable(error, {
        message: 'Cannot delete post at this moment',
        serviceName: 'database',
        shouldLog: true,
      });
      throwIfRequestTimeout(error, {
        message: 'Failed to delete post',
        context: 'database query',
      });
      throwIfUnexpectedError(error, {
        userMessage: 'Failed to delete post',
        context: 'post-delete',
        originalError: error,
      });
      throw error;
    }
  }
}
