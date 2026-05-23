import { Post } from '../modules/posts/post.entity';
import { parseJsonField } from './parse-json-field.helper';

/**
 * Formats a post with author details for API responses.
 * Concatenates firstName and lastName and includes email.
 * Parses JSON fields like schema and metaValue.
 */
export function formatPostWithAuthor(post: Post) {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    content: post.content,
    postType: post.postType,
    status: post.status,
    schema: post.schema ? parseJsonField(post.schema) : null,
    featuredImageUrl: post.featuredImageUrl,
    publishOn: post.publishOn,
    tags: post.tags,
    metaValue: post.metaValue ? parseJsonField(post.metaValue.metaValue) : null,
    author: post.author
      ? {
          name: `${post.author.firstName} ${post.author.lastName ?? ''}`.trim(),
          email: post.author.email,
        }
      : null,
  };
}
