import { Inject, Injectable } from '@nestjs/common';
import { IPaginated } from '../interfaces/paginated.interface';
import { PaginationQueryDto } from '../dtos/pagination-query.dto';
import { FindOptionsOrder, FindOptionsWhere, ObjectLiteral, Repository } from 'typeorm';
import { Request } from 'express';
import { REQUEST } from '@nestjs/core';

/**
 * Optional provider-level pagination behaviors for repository-backed queries.
 */
type PaginationOptions<T extends ObjectLiteral> = {
  /**
   * Sort order applied to the paginated repository query.
   */
  order?: FindOptionsOrder<T>;
  /**
   * Optional filter conditions applied to the paginated repository query.
   */
  where?: FindOptionsWhere<T> | FindOptionsWhere<T>[];
};

/**
 * Hard maximum page size accepted by the pagination provider.
 */
const MAX_LIMIT = 100;

@Injectable()
/**
 * Provides reusable pagination behavior for list queries.
 */
export class PaginationProvider {
  /**
   * Creates an instance of PaginationProvider.
   *
   * @param request Active HTTP request used to generate absolute pagination links.
   */
  constructor(
    @Inject(REQUEST)
    private readonly request: Request,
  ) {}

  /**
   * Runs a repository query with pagination and returns a normalized paginated response.
   *
   * @param paginateQuery Incoming pagination query values.
   * @param repository Repository used to fetch and count records.
   * @param options Optional query behaviors such as deterministic ordering.
   * @returns Paginated response containing metadata, links, and result data.
   */
  public async paginateQuery<T extends ObjectLiteral>(
    paginateQuery: PaginationQueryDto,
    repository: Repository<T>,
    options: PaginationOptions<T> = {},
  ): Promise<IPaginated<T>> {
    const currentPage = paginateQuery.page ?? 1;
    const requestedLimit = paginateQuery.limit ?? 10;
    const limit = Math.min(requestedLimit, MAX_LIMIT);
    const order =
      options.order ?? (({ id: 'DESC' } as unknown) as FindOptionsOrder<T>);

    const results = await repository.find({
      skip: (currentPage - 1) * limit,
      take: limit,
      order,
      ...(options.where ? { where: options.where } : {}),
    });

    const baseURL = `${this.request.protocol}://${this.request.get('host')}${this.request.path}`;
    const totalItems = await repository.count({ where: options.where });
    const totalPages = Math.max(1, Math.ceil(totalItems / limit));
    const nextPage = currentPage < totalPages ? currentPage + 1 : null;
    const previousPage = currentPage > 1 ? currentPage - 1 : null;

    const baseParams = this.buildBaseParams(limit);
    const links = {
      first: this.buildPageLink(baseURL, baseParams, 1),
      previous: previousPage
        ? this.buildPageLink(baseURL, baseParams, previousPage)
        : null,
      next: nextPage ? this.buildPageLink(baseURL, baseParams, nextPage) : null,
      last: this.buildPageLink(baseURL, baseParams, totalPages),
      current: this.buildPageLink(baseURL, baseParams, currentPage),
    };

    const finalResponse: IPaginated<T> = {
      meta: {
        totalItems,
        itemsPerPage: limit,
        totalPages,
        currentPage,
      },
      links,
      data: results,
    };

    return finalResponse;
  }

  /**
   * Builds base query parameters for pagination links while preserving non-pagination filters.
   *
   * @param limit Effective page size used in the current response.
   * @returns URLSearchParams containing preserved query values and normalized limit.
   */
  private buildBaseParams(limit: number): URLSearchParams {
    const params = new URLSearchParams();

    for (const [key, value] of Object.entries(this.request.query ?? {})) {
      if (key === 'page' || key === 'limit') {
        continue;
      }

      const entries = this.normalizeQueryValue(value);
      for (const entry of entries) {
        params.append(key, entry);
      }
    }

    params.set('limit', limit.toString());
    return params;
  }

  /**
   * Builds an absolute page link from a base URL and query parameters.
   *
   * @param baseURL Absolute route URL without query string.
   * @param baseParams Preserved query parameters.
   * @param page Target page number.
   * @returns Full URL including page and other query parameters.
   */
  private buildPageLink(
    baseURL: string,
    baseParams: URLSearchParams,
    page: number,
  ): string {
    const params = new URLSearchParams(baseParams);
    params.set('page', page.toString());
    return `${baseURL}?${params.toString()}`;
  }

  /**
   * Normalizes request query values into a flat string array for URL encoding.
   *
   * @param value Raw query value from the request object.
   * @returns Flat string array compatible with URLSearchParams append behavior.
   */
  private normalizeQueryValue(value: unknown): string[] {
    if (value === undefined || value === null) {
      return [];
    }

    if (Array.isArray(value)) {
      return value
        .flatMap((item) => this.normalizeQueryValue(item))
        .filter((item) => item.length > 0);
    }

    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      return [String(value)];
    }

    return [];
  }
}
