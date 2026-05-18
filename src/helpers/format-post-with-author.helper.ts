import { Post } from '../modules/posts/post.entity';

/**
 * Formats a post with author details for API responses.
 * Concatenates firstName and lastName and includes email.
 */
export function formatPostWithAuthor(post: Post) {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    content: post.content,
    postType: post.postType,
    status: post.status,
    schema: post.schema,
    featuredImageUrl: post.featuredImageUrl,
    publishOn: post.publishOn,
    tags: post.tags,
    metaOptions: post.metaOptions,
    author: post.author
      ? {
          name: `${post.author.firstName} ${post.author.lastName ?? ''}`.trim(),
          email: post.author.email,
        }
      : null,
  };
}
