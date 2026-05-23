import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Tag } from '../tag.entity';
import { Repository } from 'typeorm';
import { PostTagDto } from '../dtos/post-tag.dto';

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
}
