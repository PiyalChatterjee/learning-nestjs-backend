import { Injectable } from '@nestjs/common';
import { PostMetaOptionDto } from '../dtos/post-meta-options.dto';
import { Repository } from 'typeorm';
import { MetaOption } from '../meta-option.entity';
import { InjectRepository } from '@nestjs/typeorm';

/**
 * Handles persistence operations for metadata options.
 */
@Injectable()
export class MetaOptionsService {
  /**
   * Initializes meta-options persistence dependencies.
   */
  constructor(
    /**
     * inject meta option repository here if you want to persist meta options in the database
     * For this example, we are just returning a mock object without database interaction.
     * You can use TypeORM or any other ORM to handle database operations for meta options.
     */
    @InjectRepository(MetaOption)
    private readonly metaOptionRepository: Repository<MetaOption>,
  ) {}

  /**
   * Creates and persists a metadata option entity.
   */
  public async createMetaOption(postMetaOptionDto: PostMetaOptionDto) {
    /**
     * Create a new MetaOption instance from the provided DTO and persist it to the database.
     * Returns the saved entity with generated database identifiers.
     */
    const metaOption = this.metaOptionRepository.create(postMetaOptionDto);
    await this.metaOptionRepository.save(metaOption);
    return metaOption;
  }
}
