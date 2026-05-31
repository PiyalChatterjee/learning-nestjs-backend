import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { validateEmail } from '../../../common/exceptions/bad-request.helper';
import { throwIfBulkOperationError } from '../../../common/exceptions/bulk-operation-error.helper';
import { throwIfUniqueConstraintViolation } from '../../../common/exceptions/unique-constraint.helper';
import { assertResourceExists } from '../../../common/exceptions/not-found.helper';
import { TagRelationValidator } from '../../../common/validators/tag-relation.validator';
import { CreateManyPostsDto } from '../dtos/create-many-posts.dto';
import { Post } from '../post.entity';
import { User } from '../../users/user.entity';
import { MetaOption } from '../../meta-options/meta-option.entity';

/**
 * Handles bulk post creation within a single atomic database transaction.
 * Manages tag resolution, author lookup, and relationship coordination
 * for multiple posts in an all-or-nothing fashion.
 * Extracted from PostsService to keep the service lean and follow
 * the single-responsibility principle.
 */
@Injectable()
export class PostCreateManyProvider {
  /**
   * Maximum number of posts allowed in a single batch creation request.
   */
  private readonly MAX_BATCH_SIZE = 50;

  /**
   * @param dataSource - TypeORM DataSource used to create and manage query runners for transactional operations.
   * @param postRepository - Post repository for database persistence.
   * @param userRepository - User repository for author lookup.
   * @param metaOptionRepository - MetaOption repository for metadata persistence.
   * @param tagRelationValidator - Validator for resolving tag slugs to tag entities.
   */
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(MetaOption)
    private readonly metaOptionRepository: Repository<MetaOption>,
    private readonly tagRelationValidator: TagRelationValidator,
  ) {}

  /**
   * Creates multiple posts in a single atomic transaction.
   * All posts are validated and prepared in memory first, including author lookup and tag resolution,
   * then saved in one bulk operation with their relationships.
   * If any validation or DB error occurs, the entire transaction is rolled back to prevent partial writes.
   *
   * @param createManyPostsDto - Object containing array of DTOs with post creation data.
   * @returns The array of persisted {@link Post} entities with formatted author details.
   * @throws BadRequestException if batch is empty, exceeds size limit, or contains duplicate slugs.
   * @throws NotFoundException if an author email or tag slug cannot be resolved.
   * @throws ConflictException if a slug is already in use.
   * @throws RequestTimeoutException if the database operation times out.
   * @throws ServiceUnavailableException if the database is unreachable.
   * @throws InternalServerErrorException for any other unexpected error.
   */
  public async createManyPosts(createManyPostsDto: CreateManyPostsDto) {
    let newPosts: Post[] = [];
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Validate batch size to prevent resource exhaustion
      if (createManyPostsDto.posts.length === 0) {
        throw new BadRequestException('Batch must contain at least one post');
      }
      if (createManyPostsDto.posts.length > this.MAX_BATCH_SIZE) {
        throw new BadRequestException(
          `Batch size cannot exceed ${this.MAX_BATCH_SIZE} posts`,
        );
      }

      // Detect duplicate slugs within the batch to fail fast before DB operations
      const slugsInBatch = new Set<string>();
      for (const dto of createManyPostsDto.posts) {
        if (slugsInBatch.has(dto.slug)) {
          throw new BadRequestException(`Duplicate slug in batch: ${dto.slug}`);
        }
        slugsInBatch.add(dto.slug);
      }

      // Prepare all posts with author lookups and tag resolution in memory first
      for (const dto of createManyPostsDto.posts) {
        // Validate author email format
        validateEmail(dto.authorEmail);

        // Look up the author by email within the transaction context
        const author = assertResourceExists(
          await queryRunner.manager.findOne(User, {
            where: { email: dto.authorEmail },
          }),
          'Author',
          dto.authorEmail,
        );

        // Resolve tags to ensure they exist; errors thrown here are caught below
        const postTags = await this.tagRelationValidator.resolveTagsOrThrow(
          dto.tags || [],
        );

        // Extract nested fields and create post entity in memory
        const { authorEmail, metaOption, tags = [], ...postData } = dto;
        const newPost = queryRunner.manager.create(Post, {
          ...postData,
          tags: postTags,
          metaValue: (metaOption as unknown as typeof newPost.metaValue) ??
            undefined,
        });
        newPost.author = author;

        newPosts.push(newPost);
      }

      // Bulk save all prepared post entities in a single operation
      newPosts = await queryRunner.manager.save(newPosts);

      // Commit transaction after all posts and their relationships are successfully persisted
      await queryRunner.commitTransaction();
      return newPosts;
    } catch (error) {
      // Rollback transaction to ensure data integrity on any error
      await queryRunner.rollbackTransaction();

      // Check for unique constraint violations on slug
      throwIfUniqueConstraintViolation(error, {
        message: 'One or more post slugs are already in use',
      });

      // Cascade through service unavailable → timeout → unexpected error patterns
      // See bulk-operation-error.helper.ts for the cascading logic
      throwIfBulkOperationError(error, {
        userMessage: 'Failed to create posts',
        context: 'posts-batch-creation',
      });
    } finally {
      // Ensure the query runner is released after the operation is complete,
      // regardless of success or failure, to free up database connections and resources.
      await queryRunner.release();
    }
  }
}
