/**
 * Enumeration of post lifecycle states.
 * Tracks the publishing workflow status for posts in the system.
 */
export enum PostStatus {
  /** Post is in progress and not yet ready for publication */
  DRAFT = 'draft',
  /** Post is prepared for automatic publication at a future time */
  SCHEDULED = 'scheduled',
  /** Post is pending editorial review before publication */
  REVIEW = 'review',
  /** Post is published and visible to all users */
  PUBLISHED = 'published',
}