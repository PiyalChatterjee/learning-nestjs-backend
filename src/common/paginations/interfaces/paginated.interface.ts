/**
 * Generic paginated response shape returned by list endpoints.
 */
export interface IPaginated<T> {
  /**
   * Paging metadata for the current response.
   */
  meta: {
    totalItems: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };

  /**
   * Navigational links for paging between result sets.
   */
  links: {
    first: string;
    previous: string | null;
    next: string | null;
    last: string;
    current: string;
  };

  /**
   * Result items for the current page.
   */
  data: T[];
}
