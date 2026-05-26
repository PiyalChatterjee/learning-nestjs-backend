import { Post } from '../modules/posts/post.entity';

/**
 * Formats a minimal post summary for use inside related resource responses (e.g. tags).
 * Returns only essential fields without full content or meta details.
 */
export function formatPostSummary(post: Post) {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    postType: post.postType,
    status: post.status,
    featuredImageUrl: post.featuredImageUrl,
    author: post.author
      ? {
          name: `${post.author.firstName} ${post.author.lastName ?? ''}`.trim(),
          email: post.author.email,
        }
      : null,
  };
}
