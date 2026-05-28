/**
 * Enumeration of supported post types in the system.
 * Defines the content categorization for blog posts and related content.
 */
export enum PostType {
  /** Standard blog post format */
  POST = 'post',
  /** Static page content */
  PAGE = 'page',
  /** Short-form narrative content */
  STORY = 'story',
  /** Multi-part serialized content */
  SERIES = 'series',
}
