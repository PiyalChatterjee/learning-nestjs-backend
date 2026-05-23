import { Tag } from '../modules/tags/tag.entity';
import { parseJsonField } from './parse-json-field.helper';

/**
 * Formats a tag for API responses.
 * Parses schema and description JSON fields if they contain JSON strings.
 */
export function formatTag(tag: Tag) {
  return {
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
    description: tag.description,
    schema: tag.schema ? parseJsonField(tag.schema) : null,
    featureImageUrl: tag.featureImageUrl,
    createDate: tag.createDate,
    updateDate: tag.updateDate,
  };
}
