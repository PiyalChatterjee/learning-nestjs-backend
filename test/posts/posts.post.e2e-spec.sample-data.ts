import { faker } from '@faker-js/faker';
import { PostType } from '../../src/modules/posts/enums/post-type.enum';
import { PostStatus } from '../../src/modules/posts/enums/post-status.enum';

/**
 * Generates a valid post payload with all required fields.
 */
export function validPostPayload() {
  return {
    title: faker.lorem.sentence({ min: 3, max: 8 }),
    postType: PostType.POST,
    slug: faker.helpers.slugify(faker.lorem.words(3)).toLowerCase(),
    content: faker.lorem.paragraphs(2),
    status: PostStatus.DRAFT,
    publishOn: new Date().toISOString(),
    tags: [], // Empty array - tags must exist in database
  };
}

/**
 * Generates a post payload missing the title field.
 */
export function postWithMissingTitle() {
  return {
    postType: PostType.POST,
    slug: faker.helpers.slugify(faker.lorem.words(3)).toLowerCase(),
    content: faker.lorem.paragraphs(2),
    status: PostStatus.DRAFT,
    publishOn: new Date().toISOString(),
    tags: [], // Empty array - tags must exist in database
  };
}

/**
 * Generates a post payload missing the slug field.
 */
export function postWithMissingSlug() {
  return {
    title: faker.lorem.sentence({ min: 3, max: 8 }),
    postType: PostType.POST,
    content: faker.lorem.paragraphs(2),
    status: PostStatus.DRAFT,
    publishOn: new Date().toISOString(),
    tags: [], // Empty array - tags must exist in database
  };
}

/**
 * Generates a post payload with an invalid postType.
 */
export function postWithInvalidPostType() {
  return {
    title: faker.lorem.sentence({ min: 3, max: 8 }),
    postType: 'INVALID_TYPE',
    slug: faker.helpers.slugify(faker.lorem.words(3)).toLowerCase(),
    content: faker.lorem.paragraphs(2),
    status: PostStatus.DRAFT,
    publishOn: new Date().toISOString(),
    tags: [], // Empty array - tags must exist in database
  };
}

/**
 * Generates a post payload with an invalid status.
 */
export function postWithInvalidStatus() {
  return {
    title: faker.lorem.sentence({ min: 3, max: 8 }),
    postType: PostType.POST,
    slug: faker.helpers.slugify(faker.lorem.words(3)).toLowerCase(),
    content: faker.lorem.paragraphs(2),
    status: 'INVALID_STATUS',
    publishOn: new Date().toISOString(),
    tags: [], // Empty array - tags must exist in database
  };
}

/**
 * Generates a post payload with featured image URL.
 */
export function postWithFeaturedImage() {
  return {
    title: faker.lorem.sentence({ min: 3, max: 8 }),
    postType: PostType.POST,
    slug: faker.helpers.slugify(faker.lorem.words(3)).toLowerCase(),
    content: faker.lorem.paragraphs(2),
    status: PostStatus.DRAFT,
    publishOn: new Date().toISOString(),
    featuredImageUrl: 'https://example.com/image.jpg',
    tags: [], // Empty array - tags must exist in database
  };
}
