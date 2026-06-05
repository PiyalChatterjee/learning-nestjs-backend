import { Module } from '@nestjs/common';
import { PaginationProvider } from './provider/pagination.provider';

/**
 * Pagination module that provides utilities for cursor-based and offset-based pagination.
 *
 * Exports the PaginationProvider service which is used by feature modules to:
 * - Parse and validate pagination query parameters
 * - Calculate limit, offset, skip values for database queries
 * - Format paginated response data with metadata (total, page, limit, etc.)
 *
 * Usage:
 * ```typescript
 * // In your module
 * @Module({
 *   imports: [PaginationModule],
 * })
 * export class YourModule {}
 *
 * // In your service
 * constructor(private paginationProvider: PaginationProvider) {}
 * ```
 *
 * @module PaginationModule
 */
@Module({
  providers: [PaginationProvider],
  exports: [PaginationProvider],
})
export class PaginationModule {}
