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
   *
   * This method performs a database lookup to find tags by their slug identifiers.
   * It removes duplicate slugs before querying and validates that all provided slugs
   * correspond to existing tags in the database.
   *
   * @param {string[]} tagSlugs - Array of URL-friendly tag slug identifiers to resolve.
   *                              Duplicates are automatically removed.
   *
   * @returns {Promise<Tag[]>} Promise resolving to an array of found Tag entities
   *          in the same order as the query results (may differ from input order).
   *          Returns an empty array if tagSlugs is empty.
   *
   * @throws {NotFoundException} If any of the provided slugs do not exist in the database.
   *                            The error message lists all missing slugs.
   *                            Example: "Tags not found: non-existent-tag, another-missing"
   *
   * @example
   * // Successfully resolve tags
   * const tags = await validator.resolveTagsOrThrow(['nestjs', 'typescript', 'backend']);
   * // Returns: [Tag { id: 1, slug: 'nestjs', ... }, Tag { id: 2, slug: 'typescript', ... }, ...]
   *
   * @example
   * // Throws NotFoundException for missing tags
   * try {
   *   await validator.resolveTagsOrThrow(['nestjs', 'invalid-tag']);
   * } catch (error) {
   *   // error.message === "Tags not found: invalid-tag"
   * }
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
      throw new NotFoundException(
        `Tags not found: ${missingTagSlugs.join(', ')}`,
      );
    }

    return tags;
  }
}
