import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { PostMetaOptionDto } from '../dtos/post-meta-options.dto';
import { Repository } from 'typeorm';
import { MetaOption } from '../meta-option.entity';
import { MetaOption as MongoMetaOption } from '../meta-option.schema';
import { InjectRepository } from '@nestjs/typeorm';
import { throwIfRequestTimeout } from '../../../common/exceptions/request-timeout.helper';
import { throwIfServiceUnavailable } from '../../../common/exceptions/service-unavailable.helper';
import { throwIfUnexpectedError } from '../../../common/exceptions/internal-error.helper';

/**
 * Handles persistence operations for metadata options.
 */
@Injectable()
export class MetaOptionsService {
  /**
   * Creates dependencies for metadata option management.
   * @param metaOptionRepository Repository for persisting and retrieving metadata option entities.
   * @param metaOptionModel Mongoose model for persisting meta options to MongoDB.
   */
  constructor(
    @InjectRepository(MetaOption)
    private readonly metaOptionRepository: Repository<MetaOption>,
    @InjectModel(MongoMetaOption.name)
    private readonly metaOptionModel: Model<MongoMetaOption>,
  ) {}

  /**
   * Creates and persists a metadata option entity.
   */
  public async createMetaOption(
    postMetaOptionDto: PostMetaOptionDto,
  ): Promise<MetaOption> {
    try {
      /**
       * Create a new MetaOption instance from the provided DTO and persist it to the database.
       * Returns the saved entity with generated database identifiers.
       */
      const metaOption = this.metaOptionRepository.create(postMetaOptionDto);
      await this.metaOptionRepository.save(metaOption);

      // persist the meta option to MongoDB
      await this.metaOptionModel.create({
        sqlId: metaOption.id,
        metaValue: typeof metaOption.metaValue === 'string'
          ? JSON.parse(metaOption.metaValue)
          : metaOption.metaValue,
        postId: metaOption.post?.id?.toString() ?? null,
      });

      return metaOption;
    } catch (error) {
      throwIfServiceUnavailable(error, {
        message: 'Cannot create meta option at this moment',
        serviceName: 'database',
        shouldLog: true,
      });
      throwIfRequestTimeout(error, {
        message: 'Failed to create meta option',
        context: 'database query',
      });
      throwIfUnexpectedError(error, {
        userMessage: 'Failed to create meta option',
        context: 'meta-option-creation',
        originalError: error,
      });
      throw error;
    }
  }
}
