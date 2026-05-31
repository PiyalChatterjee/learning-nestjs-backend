export interface IPaginated<T> {
  meta: {
    totalItems: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
  links: {
    first: string;
    previous: string | null;
    next: string | null;
    last: string;
    current: string;
  };
  data: T[];
}
