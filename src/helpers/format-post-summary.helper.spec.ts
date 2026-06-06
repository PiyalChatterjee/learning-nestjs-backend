import { formatPostSummary } from './format-post-summary.helper';
import { Post } from '../modules/posts/post.entity';
import { PostStatus } from '../modules/posts/enums/post-status.enum';

describe('formatPostSummary', () => {
  const mockAuthor = {
    id: 1,
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@example.com',
  };

  const mockPost: Partial<Post> = {
    id: 1,
    title: 'Test Post',
    slug: 'test-post',
    postType: 'article',
    status: PostStatus.Published,
    featuredImageUrl: 'https://example.com/image.jpg',
    author: mockAuthor as any,
  };

  it('should format post summary with basic fields', () => {
    const result = formatPostSummary(mockPost as Post);

    expect(result.id).toBe(mockPost.id);
    expect(result.title).toBe(mockPost.title);
    expect(result.slug).toBe(mockPost.slug);
    expect(result.postType).toBe(mockPost.postType);
    expect(result.status).toBe(mockPost.status);
  });

  it('should include author name and email', () => {
    const result = formatPostSummary(mockPost as Post);

    expect(result.author).toBeDefined();
    expect(result.author.name).toBe('Jane Smith');
    expect(result.author.email).toBe('jane@example.com');
  });

  it('should exclude content field from summary', () => {
    const postWithContent = {
      ...mockPost,
      content: 'This is full post content that should not appear in summary',
    };

    const result = formatPostSummary(postWithContent as Post);

    expect(result).not.toHaveProperty('content');
  });

  it('should exclude metaValue from summary', () => {
    const postWithMetaValue = {
      ...mockPost,
      metaValue: { title: 'Meta Title' },
    };

    const result = formatPostSummary(postWithMetaValue as Post);

    expect(result).not.toHaveProperty('metaValue');
  });

  it('should handle post without author', () => {
    const postWithoutAuthor = {
      ...mockPost,
      author: null,
    };

    const result = formatPostSummary(postWithoutAuthor as Post);

    expect(result.author).toBeNull();
  });

  it('should concatenate author firstName and lastName correctly', () => {
    const result = formatPostSummary(mockPost as Post);
    expect(result.author.name).toBe('Jane Smith');
  });

  it('should handle author with only firstName', () => {
    const postWithSingleName = {
      ...mockPost,
      author: { ...mockAuthor, lastName: null } as any,
    };

    const result = formatPostSummary(postWithSingleName as Post);
    expect(result.author.name).toBe('Jane');
  });

  it('should handle author with empty lastName', () => {
    const postWithEmptyLastName = {
      ...mockPost,
      author: { ...mockAuthor, lastName: '' } as any,
    };

    const result = formatPostSummary(postWithEmptyLastName as Post);
    expect(result.author.name).toBe('Jane');
  });

  it('should include featured image URL', () => {
    const result = formatPostSummary(mockPost as Post);
    expect(result.featuredImageUrl).toBe('https://example.com/image.jpg');
  });

  it('should handle null featured image URL', () => {
    const postWithoutImage = {
      ...mockPost,
      featuredImageUrl: null,
    };

    const result = formatPostSummary(postWithoutImage as Post);
    expect(result.featuredImageUrl).toBeNull();
  });

  it('should preserve post status values', () => {
    const draftPost = {
      ...mockPost,
      status: PostStatus.Draft,
    };

    const result = formatPostSummary(draftPost as Post);
    expect(result.status).toBe(PostStatus.Draft);
  });

  it('should include all essential fields in response', () => {
    const result = formatPostSummary(mockPost as Post);

    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('title');
    expect(result).toHaveProperty('slug');
    expect(result).toHaveProperty('postType');
    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('featuredImageUrl');
    expect(result).toHaveProperty('author');
  });

  it('should not include tags field in summary', () => {
    const postWithTags = {
      ...mockPost,
      tags: [{ id: 1, name: 'JavaScript' }],
    };

    const result = formatPostSummary(postWithTags as Post);

    expect(result).not.toHaveProperty('tags');
  });

  it('should handle different post types', () => {
    const types = ['article', 'news', 'blog', 'guide'];

    types.forEach((type) => {
      const post = {
        ...mockPost,
        postType: type,
      };

      const result = formatPostSummary(post as Post);
      expect(result.postType).toBe(type);
    });
  });
});
