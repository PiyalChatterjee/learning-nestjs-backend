import { faker } from '@faker-js/faker';

/**
 * Generates a valid tag payload with all required fields.
 */
export function validTagPayload() {
  const name = faker.lorem.word({ length: { min: 3, max: 10 } });
  return {
    name,
    slug: `https://example.com/tags/${name.toLowerCase()}`,
    description: faker.lorem.sentence(),
  };
}

/**
 * Generates a tag payload missing the name field.
 */
export function tagWithMissingName() {
  const name = faker.lorem.word({ length: { min: 3, max: 10 } });
  return {
    slug: `https://example.com/tags/${name.toLowerCase()}`,
    description: faker.lorem.sentence(),
  };
}

/**
 * Generates a tag payload missing the slug field.
 */
export function tagWithMissingSlug() {
  return {
    name: faker.lorem.word({ length: { min: 3, max: 10 } }),
    description: faker.lorem.sentence(),
  };
}

/**
 * Generates a tag payload with feature image URL.
 */
export function tagWithFeatureImage() {
  const name = faker.lorem.word({ length: { min: 3, max: 10 } });
  return {
    name,
    slug: `https://example.com/tags/${name.toLowerCase()}`,
    description: faker.lorem.sentence(),
    featureImageUrl: 'https://example.com/tag-image.jpg',
  };
}

/**
 * Generates a tag payload with schema metadata.
 */
export function tagWithSchema() {
  const name = faker.lorem.word({ length: { min: 3, max: 10 } });
  return {
    name,
    slug: `https://example.com/tags/${name.toLowerCase()}`,
    description: faker.lorem.sentence(),
    schema: '{"type": "tag"}',
  };
}
