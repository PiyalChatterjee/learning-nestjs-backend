import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Tag } from '../tag.entity';
import { Post } from '../../posts/post.entity';
import { Repository } from 'typeorm';
import { PostTagDto } from '../dtos/post-tag.dto';
import { assertResourceExists } from '../../../common/exceptions/not-found.helper';

/**
 * Handles persistence operations for tags.
 */
@Injectable()
export class TagsService {
    /**
     * Initializes tags persistence dependencies.
     */
    constructor(
        /**
         * Inject Tag repository here if you want to persist tags in the database
         * For this example, we are just returning a mock object without database interaction.
         * You can use TypeORM or any other ORM to handle database operations for tags.
         */
        @InjectRepository(Tag)
        private readonly tagRepository: Repository<Tag>,
        @InjectRepository(Post)
        private readonly postRepository: Repository<Post>,
    ) {}

    /**
     * Creates and persists a tag entity.
     */
    public async createTag(postTagDto: PostTagDto) {
        /**
         * Create a new Tag instance with the provided name and persist it to the database.
         * Returns the saved entity with generated database identifiers.
         */
        const tag = this.tagRepository.create(postTagDto);
        await this.tagRepository.save(tag);
        return tag;
    }

    /**
     * Returns all tags from storage.
     */
    public async getAllTags() {
        /**
         * Fetches all tags from the database and returns them as an array.
         */
        return this.tagRepository.find();
    }

    /**
     * Returns a single tag by id including its associated posts.
     * Posts are fetched via a separate query on postRepository to avoid
     * a circular join cycle caused by eager Post.tags pointing back to Tag.
     */
    public async getTagWithPosts(tagId: number) {
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
    }

    /**
     * Soft-deletes a tag by id using the DeleteDateColumn field.
     */
    public async deleteTag(tagId: number) {
        const tag = assertResourceExists(
            await this.tagRepository.findOne({ where: { id: tagId } }),
            'Tag',
            tagId,
        );

        await this.tagRepository.softRemove(tag);

        return {
            message: `Tag with id ${tagId} deleted successfully`,
        };
    }
}
