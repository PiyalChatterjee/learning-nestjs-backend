/**
 * Enumeration for sort order direction in pagination queries.
 *
 * Used to specify whether results should be sorted in ascending or descending order.
 * Applied to fields in GetXxxDto query parameters.
 *
 * @enum {string}
 */
export enum SortOrder {
  /**
   * Sort results in ascending order (smallest to largest, A to Z).
   * @type {'asc'}
   */
  Ascending = 'asc',

  /**
   * Sort results in descending order (largest to smallest, Z to A).
   * @type {'desc'}
   */
  Descending = 'desc',
}