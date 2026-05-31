import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { throwIfBulkOperationError } from '../../../common/exceptions/bulk-operation-error.helper';
import { throwIfUniqueConstraintViolation } from '../../../common/exceptions/unique-constraint.helper';
import { CreateManyTagsDto } from '../dtos/create-many-tags.dto';
import { Tag } from '../tag.entity';

/**
 * Handles bulk tag creation within a single atomic database transaction.
 * Extracted from TagsService to keep the service lean and follow
 * the single-responsibility principle.
 */
@Injectable()
export class TagCreateManyProvider {
  /**
   * Maximum number of tags allowed in a single batch creation request.
   */
  private readonly MAX_BATCH_SIZE = 100;

  /**
   * @param dataSource - TypeORM DataSource used to create and manage query runners for transactional operations.
   * @param tagRepository - Tag repository for database persistence.
   */
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
  ) {}

  /**
   * Creates multiple tags in a single atomic transaction.
   * All tags are validated and prepared in memory first, then saved in one bulk
   * operation. If any validation or DB error occurs, the entire transaction is
   * rolled back to prevent partial writes.
   *
   * @param createManyTagsDto - Object containing array of DTOs with tag creation data.
   * @returns The array of persisted {@link Tag} entities.
   * @throws BadRequestException if batch is empty, exceeds size limit, or contains duplicate slugs.
   * @throws ConflictException if a slug is already in use.
   * @throws RequestTimeoutException if the database operation times out.
   * @throws ServiceUnavailableException if the database is unreachable.
   * @throws InternalServerErrorException for any other unexpected error.
   */
  public async createManyTags(createManyTagsDto: CreateManyTagsDto) {
    let newTags: Tag[] = [];
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Validate batch size to prevent resource exhaustion
      if (createManyTagsDto.tags.length === 0) {
        throw new BadRequestException('Batch must contain at least one tag');
      }
      if (createManyTagsDto.tags.length > this.MAX_BATCH_SIZE) {
        throw new BadRequestException(
          `Batch size cannot exceed ${this.MAX_BATCH_SIZE} tags`,
        );
      }

      // Detect duplicate slugs within the batch to fail fast before DB operations
      const slugsInBatch = new Set<string>();
      for (const dto of createManyTagsDto.tags) {
        if (slugsInBatch.has(dto.slug)) {
          throw new BadRequestException(`Duplicate slug in batch: ${dto.slug}`);
        }
        slugsInBatch.add(dto.slug);
      }

      // Prepare all tags in memory
      for (const dto of createManyTagsDto.tags) {
        const newTag = queryRunner.manager.create(Tag, {
          name: dto.name,
          slug: dto.slug,
          description: dto.description,
        });
        newTags.push(newTag);
      }

      // Bulk save all prepared tag entities in a single operation
      newTags = await queryRunner.manager.save(newTags);

      // Commit transaction after all tags are successfully persisted
      await queryRunner.commitTransaction();
      return newTags;
    } catch (error) {
      // Rollback transaction to ensure data integrity on any error
      await queryRunner.rollbackTransaction();

      // Check for unique constraint violations on slug
      throwIfUniqueConstraintViolation(error, {
        message: 'One or more tag slugs are already in use',
      });

      // Cascade through service unavailable → timeout → unexpected error patterns
      // See bulk-operation-error.helper.ts for the cascading logic
      throwIfBulkOperationError(error, {
        userMessage: 'Failed to create tags',
        context: 'tags-batch-creation',
      });
    } finally {
      // Ensure the query runner is released after the operation is complete,
      // regardless of success or failure, to free up database connections and resources.
      await queryRunner.release();
    }
  }
}
