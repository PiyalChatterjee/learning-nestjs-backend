import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Tag } from '../tag.entity';
import { Post } from '../../posts/post.entity';
import { Repository } from 'typeorm';
import { PostTagDto } from '../dtos/post-tag.dto';
import { CreateManyTagsDto } from '../dtos/create-many-tags.dto';
import { TagCreateManyProvider } from './tag-create-many.provider';
import { assertResourceExists } from '../../../common/exceptions/not-found.helper';
import { throwIfRequestTimeout } from '../../../common/exceptions/request-timeout.helper';
import { throwIfServiceUnavailable } from '../../../common/exceptions/service-unavailable.helper';
import { throwIfUnexpectedError } from '../../../common/exceptions/internal-error.helper';
import { PaginationQueryDto } from '../../../common/paginations/dtos/pagination-query.dto';
import { PaginationProvider } from '../../../common/paginations/provider/pagination.provider';
import { IPaginated } from '../../../common/paginations/interfaces/paginated.interface';
import { TDeleteResult } from '../../../common/types/delete-result.type';

/**
 * Shape returned when fetching a tag with its associated posts.
 */
type TTagWithPosts = {
  tag: Tag;
  posts: Post[];
};

/**
 * Handles persistence operations for tags.
 */
@Injectable()
export class TagsService {
    /**
     * Constructs a new instance of the TagsService.
     * @param tagRepository Repository for managing Tag entities.
     * @param postRepository Repository for managing Post entities.
     * @param tagCreateManyProvider Provider for handling bulk tag creation.
     * @param paginationProvider Provider for handling pagination logic.        
     */
    constructor(
        /**
         * Inject Tag repository here if you want to persist tags in the database
         * For this example, we are just returning a mock object without database interaction.
         * You can use TypeORM or any other ORM to handle database operations for tags.
         * Inject pagination provider to handle pagination logic for fetching tags.
         */
        @InjectRepository(Tag)
        private readonly tagRepository: Repository<Tag>,
        @InjectRepository(Post)
        private readonly postRepository: Repository<Post>,
        private readonly tagCreateManyProvider: TagCreateManyProvider,
        private readonly paginationProvider: PaginationProvider,
    ) {}

    /**
     * Creates and persists a tag entity.
     */
    public async createTag(postTagDto: PostTagDto): Promise<Tag> {
        try {
            /**
             * Create a new Tag instance with the provided name and persist it to the database.
             * Returns the saved entity with generated database identifiers.
             */
            const tag = this.tagRepository.create(postTagDto);
            await this.tagRepository.save(tag);
            return tag;
        } catch (error) {
            throwIfServiceUnavailable(error, {
                message: 'Cannot create tag at this moment',
                serviceName: 'database',
                shouldLog: true,
            });
            throwIfRequestTimeout(error, {
                message: 'Failed to create tag',
                context: 'database query',
            });
            throwIfUnexpectedError(error, {
                userMessage: 'Failed to create tag',
                context: 'tag-creation',
                originalError: error,
            });
            throw error;
        }
    }

    /**
     * Creates multiple tags in a single atomic transaction.
     * Delegates to TagCreateManyProvider which handles batch validation,
     * duplicate detection, and transactional persistence.
     * See TagCreateManyProvider for detailed bulk operation semantics.
     */
    public async createManyTags(createManyTagsDto: CreateManyTagsDto): Promise<Tag[]> {
        return this.tagCreateManyProvider.createManyTags(createManyTagsDto);
    }

    /**
     * Returns all tags from storage.
     */
    public async getAllTags(paginationQuery: PaginationQueryDto): Promise<IPaginated<Tag>> {
        try {
            // Fetch tags from the database through shared pagination provider.
            return this.paginationProvider.paginateQuery(
                {
                    page: paginationQuery.page || 1,
                    limit: paginationQuery.limit || 10,
                },
                this.tagRepository,
                {
                    order: { id: 'DESC' },
                },
            );
        } catch (error) {
            throwIfServiceUnavailable(error, {
                message: 'Cannot fetch tags at this moment',
                serviceName: 'database',
                shouldLog: true,
            });
            throwIfRequestTimeout(error, {
                message: 'Failed to fetch tags',
                context: 'database query',
            });
            throwIfUnexpectedError(error, {
                userMessage: 'Failed to fetch tags',
                context: 'tag-fetch-all',
                originalError: error,
            });
            throw error;
        }
    }

    /**
     * Returns a single tag by id including its associated posts.
     * Posts are fetched via a separate query on postRepository to avoid
     * a circular join cycle caused by eager Post.tags pointing back to Tag.
     */
    public async getTagWithPosts(tagId: number): Promise<TTagWithPosts> {
        try {
            const tag = assertResourceExists(
                await this.tagRepository.findOne({ where: { id: tagId } }),
                'Tag',
                tagId,
            );

            const posts = await this.postRepository
                .createQueryBuilder('post')
                .innerJoin('post.tags', 'tag', 'tag.id = :tagId', { tagId })
                .leftJoinAndSelect('post.author', 'author')
                .getMany();

            return { tag, posts };
        } catch (error) {
            throwIfServiceUnavailable(error, {
                message: 'Cannot fetch tag at this moment',
                serviceName: 'database',
                shouldLog: true,
            });
            throwIfRequestTimeout(error, {
                message: 'Failed to fetch tag with posts',
                context: 'database query',
            });
            throwIfUnexpectedError(error, {
                userMessage: 'Failed to fetch tag',
                context: 'tag-fetch-with-posts',
                originalError: error,
            });
            throw error;
        }
    }

    /**
     * Soft-deletes a tag by id using the DeleteDateColumn field.
     */
    public async deleteTag(tagId: number): Promise<TDeleteResult> {
        try {
            const tag = assertResourceExists(
                await this.tagRepository.findOne({ where: { id: tagId } }),
                'Tag',
                tagId,
            );

            await this.tagRepository.softRemove(tag);

            return {
                message: `Tag with id ${tagId} deleted successfully`,
            };
        } catch (error) {
            throwIfServiceUnavailable(error, {
                message: 'Cannot delete tag at this moment',
                serviceName: 'database',
                shouldLog: true,
            });
            throwIfRequestTimeout(error, {
                message: 'Failed to delete tag',
                context: 'database query',
            });
            throwIfUnexpectedError(error, {
                userMessage: 'Failed to delete tag',
                context: 'tag-delete',
                originalError: error,
            });
            throw error;
        }
    }
}
