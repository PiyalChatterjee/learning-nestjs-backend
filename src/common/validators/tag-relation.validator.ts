import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Tag } from '../../modules/tags/tag.entity';

/**
 * Validates and resolves post tag inputs into Tag entities.
 */
@Injectable()
export class TagRelationValidator {
  /**
   * Repository used to query persisted tags.
   */
  constructor(
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
  ) {}

  /**
   * Resolves tag slugs to Tag entities and throws if any slug does not exist.
   */
  public async resolveTagsOrThrow(tagSlugs: string[]): Promise<Tag[]> {
    if (tagSlugs.length === 0) {
      return [];
    }

    const uniqueTagSlugs = [...new Set(tagSlugs)];
    const tags = await this.tagRepository.find({
      where: {
        slug: In(uniqueTagSlugs),
      },
    });

    const foundTagSlugs = new Set(tags.map((tag) => tag.slug));
    const missingTagSlugs = uniqueTagSlugs.filter(
      (slug) => !foundTagSlugs.has(slug),
    );

    if (missingTagSlugs.length > 0) {
      throw new NotFoundException(`Tags not found: ${missingTagSlugs.join(', ')}`);
    }

    return tags;
  }
}