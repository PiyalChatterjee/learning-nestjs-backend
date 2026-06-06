import { formatTag } from './format-tag.helper';
import { Tag } from '../modules/tags/tag.entity';

describe('formatTag', () => {
  const mockTag: Partial<Tag> = {
    id: 1,
    name: 'JavaScript',
    slug: 'javascript',
    description: 'A guide to JavaScript programming',
    featureImageUrl: 'https://example.com/js.jpg',
    createDate: new Date('2024-01-01'),
    updateDate: new Date('2024-01-15'),
  };

  it('should format tag with basic fields', () => {
    const result = formatTag(mockTag as Tag);

    expect(result.id).toBe(mockTag.id);
    expect(result.name).toBe(mockTag.name);
    expect(result.slug).toBe(mockTag.slug);
    expect(result.description).toBe(mockTag.description);
  });

  it('should include feature image URL', () => {
    const result = formatTag(mockTag as Tag);
    expect(result.featureImageUrl).toBe('https://example.com/js.jpg');
  });

  it('should include create and update dates', () => {
    const result = formatTag(mockTag as Tag);

    expect(result.createDate).toEqual(new Date('2024-01-01'));
    expect(result.updateDate).toEqual(new Date('2024-01-15'));
  });

  it('should parse schema as JSON', () => {
    const schemaJson = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Thing',
      name: 'JavaScript',
    });

    const tagWithSchema = {
      ...mockTag,
      schema: schemaJson,
    };

    const result = formatTag(tagWithSchema as Tag);

    expect(result.schema).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Thing',
      name: 'JavaScript',
    });
  });

  it('should handle null schema', () => {
    const tagWithNullSchema = {
      ...mockTag,
      schema: null,
    };

    const result = formatTag(tagWithNullSchema as Tag);
    expect(result.schema).toBeNull();
  });

  it('should handle invalid JSON schema gracefully', () => {
    const invalidSchema = 'not valid json {';

    const tagWithInvalidSchema = {
      ...mockTag,
      schema: invalidSchema,
    };

    const result = formatTag(tagWithInvalidSchema as Tag);
    expect(result.schema).toBe(invalidSchema);
  });

  it('should handle undefined schema', () => {
    const tagWithUndefinedSchema = {
      ...mockTag,
      schema: undefined,
    };

    const result = formatTag(tagWithUndefinedSchema as Tag);
    expect(result.schema).toBeNull();
  });

  it('should handle null description', () => {
    const tagWithNullDescription = {
      ...mockTag,
      description: null,
    };

    const result = formatTag(tagWithNullDescription as Tag);
    expect(result.description).toBeNull();
  });

  it('should handle empty description', () => {
    const tagWithEmptyDescription = {
      ...mockTag,
      description: '',
    };

    const result = formatTag(tagWithEmptyDescription as Tag);
    expect(result.description).toBe('');
  });

  it('should handle null feature image URL', () => {
    const tagWithoutImage = {
      ...mockTag,
      featureImageUrl: null,
    };

    const result = formatTag(tagWithoutImage as Tag);
    expect(result.featureImageUrl).toBeNull();
  });

  it('should include all required fields in response', () => {
    const result = formatTag(mockTag as Tag);

    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('name');
    expect(result).toHaveProperty('slug');
    expect(result).toHaveProperty('description');
    expect(result).toHaveProperty('schema');
    expect(result).toHaveProperty('featureImageUrl');
    expect(result).toHaveProperty('createDate');
    expect(result).toHaveProperty('updateDate');
  });

  it('should handle schema with nested objects', () => {
    const schemaJson = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Thing',
      name: 'JavaScript',
      author: {
        '@type': 'Person',
        name: 'John Doe',
      },
    });

    const tagWithComplexSchema = {
      ...mockTag,
      schema: schemaJson,
    };

    const result = formatTag(tagWithComplexSchema as Tag);

    expect(result.schema).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Thing',
      name: 'JavaScript',
      author: {
        '@type': 'Person',
        name: 'John Doe',
      },
    });
  });

  it('should handle various tag names', () => {
    const names = ['JavaScript', 'TypeScript', 'React.js', 'Node.js', 'C++'];

    names.forEach((name) => {
      const tag = {
        ...mockTag,
        name,
      };

      const result = formatTag(tag as Tag);
      expect(result.name).toBe(name);
    });
  });

  it('should handle various slugs', () => {
    const slugs = ['javascript', 'typescript', 'react-js', 'node-js', 'cpp'];

    slugs.forEach((slug) => {
      const tag = {
        ...mockTag,
        slug,
      };

      const result = formatTag(tag as Tag);
      expect(result.slug).toBe(slug);
    });
  });

  it('should preserve long descriptions', () => {
    const longDescription =
      'This is a very long description that contains multiple sentences. ' +
      'It provides comprehensive information about the tag. ' +
      'It can span multiple lines and include various formatting.';

    const tag = {
      ...mockTag,
      description: longDescription,
    };

    const result = formatTag(tag as Tag);
    expect(result.description).toBe(longDescription);
  });

  it('should handle schema as stringified array', () => {
    const arraySchema = JSON.stringify([
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' },
    ]);

    const tag = {
      ...mockTag,
      schema: arraySchema,
    };

    const result = formatTag(tag as Tag);

    expect(Array.isArray(result.schema)).toBe(true);
    expect(result.schema).toHaveLength(2);
  });
});
