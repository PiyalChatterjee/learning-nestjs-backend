import { formatPostWithAuthor } from './format-post-with-author.helper';
import { Post } from '../modules/posts/post.entity';
import { PostStatus } from '../modules/posts/enums/post-status.enum';

describe('formatPostWithAuthor', () => {
  const mockAuthor = {
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
  };

  const mockPost: Partial<Post> = {
    id: 1,
    title: 'Test Post',
    slug: 'test-post',
    content: 'Test content',
    postType: 'article',
    status: PostStatus.Draft,
    featuredImageUrl: 'https://example.com/image.jpg',
    publishOn: new Date('2024-01-01'),
    tags: [],
    author: mockAuthor as any,
  };

  it('should format post with author details', () => {
    const result = formatPostWithAuthor(mockPost as Post);

    expect(result.id).toBe(mockPost.id);
    expect(result.title).toBe(mockPost.title);
    expect(result.slug).toBe(mockPost.slug);
    expect(result.content).toBe(mockPost.content);
    expect(result.author.name).toBe('John Doe');
    expect(result.author.email).toBe('john@example.com');
  });

  it('should concatenate firstName and lastName correctly', () => {
    const result = formatPostWithAuthor(mockPost as Post);
    expect(result.author.name).toBe('John Doe');
  });

  it('should handle author with only firstName', () => {
    const postWithSingleName = {
      ...mockPost,
      author: { ...mockAuthor, lastName: null } as any,
    };

    const result = formatPostWithAuthor(postWithSingleName as Post);
    expect(result.author.name).toBe('John');
  });

  it('should handle post without author', () => {
    const postWithoutAuthor = {
      ...mockPost,
      author: null,
    };

    const result = formatPostWithAuthor(postWithoutAuthor as Post);
    expect(result.author).toBeNull();
  });

  it('should parse schema as JSON', () => {
    const schemaJson = JSON.stringify({ type: 'BlogPosting' });
    const postWithSchema = {
      ...mockPost,
      schema: schemaJson,
    };

    const result = formatPostWithAuthor(postWithSchema as Post);
    expect(result.schema).toEqual({ type: 'BlogPosting' });
  });

  it('should handle invalid JSON schema gracefully', () => {
    const postWithInvalidSchema = {
      ...mockPost,
      schema: 'invalid json {',
    };

    const result = formatPostWithAuthor(postWithInvalidSchema as Post);
    expect(result.schema).toBe('invalid json {');
  });

  it('should handle null schema', () => {
    const postWithNullSchema = {
      ...mockPost,
      schema: null,
    };

    const result = formatPostWithAuthor(postWithNullSchema as Post);
    expect(result.schema).toBeNull();
  });

  it('should parse metaValue as JSON', () => {
    const metaValueJson = JSON.stringify({
      title: 'Meta Title',
      description: 'Meta Description',
    });

    const mockMetaOption = {
      metaValue: metaValueJson,
    };

    const postWithMetaValue = {
      ...mockPost,
      metaValue: mockMetaOption as any,
    };

    const result = formatPostWithAuthor(postWithMetaValue as Post);
    expect(result.metaValue).toEqual({
      title: 'Meta Title',
      description: 'Meta Description',
    });
  });

  it('should handle null metaValue', () => {
    const postWithNullMetaValue = {
      ...mockPost,
      metaValue: null,
    };

    const result = formatPostWithAuthor(postWithNullMetaValue as Post);
    expect(result.metaValue).toBeNull();
  });

  it('should include all required fields in response', () => {
    const result = formatPostWithAuthor(mockPost as Post);

    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('title');
    expect(result).toHaveProperty('slug');
    expect(result).toHaveProperty('content');
    expect(result).toHaveProperty('postType');
    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('schema');
    expect(result).toHaveProperty('featuredImageUrl');
    expect(result).toHaveProperty('publishOn');
    expect(result).toHaveProperty('tags');
    expect(result).toHaveProperty('metaValue');
    expect(result).toHaveProperty('author');
  });

  it('should preserve post status', () => {
    const postPublished = {
      ...mockPost,
      status: PostStatus.Published,
    };

    const result = formatPostWithAuthor(postPublished as Post);
    expect(result.status).toBe(PostStatus.Published);
  });

  it('should preserve tags array', () => {
    const mockTags = [
      { id: 1, name: 'JavaScript', slug: 'javascript' },
      { id: 2, name: 'TypeScript', slug: 'typescript' },
    ];

    const postWithTags = {
      ...mockPost,
      tags: mockTags as any,
    };

    const result = formatPostWithAuthor(postWithTags as Post);
    expect(result.tags).toEqual(mockTags);
  });
});
