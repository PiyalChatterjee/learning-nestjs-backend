import { Injectable } from '@nestjs/common';
import { validateEmail } from '../../../common/exceptions/bad-request.helper';
import { throwIfUnexpectedError } from '../../../common/exceptions/internal-error.helper';
import { assertResourceExists } from '../../../common/exceptions/not-found.helper';
import { throwIfRequestTimeout } from '../../../common/exceptions/request-timeout.helper';
import { throwIfServiceUnavailable } from '../../../common/exceptions/service-unavailable.helper';
import { throwIfUniqueConstraintViolation } from '../../../common/exceptions/unique-constraint.helper';
import { formatPostWithAuthor } from '../../../helpers/format-post-with-author.helper';
import { IActiveUser } from '../../auth/interfaces/active-user.interface';
import { CreatePostDto } from '../dtos/create-post.dto';
import { User } from '../../users/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Post } from '../post.entity';
import { TagRelationValidator } from '../../../common/validators/tag-relation.validator';
/**
 * Public-facing post shape returned from all read and write operations.
 * Derived from the {@link formatPostWithAuthor} helper output.
 */
export type TFormattedPost = ReturnType<typeof formatPostWithAuthor>;

/**
 * Provider dedicated to single-post creation flow.
 * Uses authenticated user claims to resolve the post author and enforces
 * tag/meta-option relationship preparation before persistence.
 */
@Injectable()
export class CreatePostProvider {
  /**
   * Creates CreatePostProvider dependencies.
   * @param userRepository - Repository used to resolve author by active-user email.
   * @param postRepository - Repository used to create and persist post entities.
   * @param tagRelationValidator - Service for validating/resolving tag URLs to tag entities.
   */
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,

    private readonly tagRelationValidator: TagRelationValidator,
  ) {}

  /**
   * Creates a new post for the authenticated user.
   * @param createPostDto - Payload describing the post to create.
   * @param activeUser - Authenticated user claims extracted from JWT.
   * @returns The created post formatted with author details.
   * @throws Throws mapped HTTP exceptions for validation, uniqueness, timeout, or DB failures.
   */
  public async createPost(
    createPostDto: CreatePostDto,
    activeUser: IActiveUser,
  ): Promise<TFormattedPost> {
    try {
      // validate author email format
      validateEmail(activeUser.email);

      // look up the author by email
      const author = assertResourceExists(
        await this.userRepository.findOne({
          where: { email: activeUser.email },
        }),
        'Author',
        activeUser.email,
      );

      // extract tags and metaOption from DTO
      const { metaOption, tags = [], ...postData } = createPostDto;
      const postTags = await this.tagRelationValidator.resolveTagsOrThrow(tags);

      // create post with author relation and metaOption relationship
      const post = this.postRepository.create({
        ...postData,
        tags: postTags,
        metaValue:
          (metaOption as unknown as typeof post.metaValue) ?? undefined,
      });
      post.author = author;

      // persist the post to the database
      await this.postRepository.save(post);

      // return formatted response with author details
      return formatPostWithAuthor(post);
    } catch (error) {
      throwIfUniqueConstraintViolation(error, {
        message: `Post with slug ${createPostDto.slug} already exists`,
      });
      throwIfServiceUnavailable(error, {
        message: 'Cannot create post at this moment',
        serviceName: 'database',
        shouldLog: true,
      });
      throwIfRequestTimeout(error, {
        message: 'Failed to create post',
        context: 'database query',
      });
      throwIfUnexpectedError(error, {
        userMessage: 'Failed to create post',
        context: 'post-creation',
        originalError: error,
      });
      throw error;
    }
  }
}
