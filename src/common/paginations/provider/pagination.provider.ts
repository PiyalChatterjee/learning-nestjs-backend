import { Inject, Injectable } from '@nestjs/common';
import { IPaginated } from '../interfaces/paginated.interface';
import { PaginationQueryDto } from '../dtos/pagination-query.dto';
import { FindOptionsOrder, ObjectLiteral, Repository } from 'typeorm';
import { Request } from 'express';
import { REQUEST } from '@nestjs/core';

type PaginationOptions<T extends ObjectLiteral> = {
  order?: FindOptionsOrder<T>;
};

const MAX_LIMIT = 100;

@Injectable()
export class PaginationProvider {
  constructor(
    @Inject(REQUEST)
    private readonly request: Request,
  ) {}
  public async paginateQuery<T extends ObjectLiteral>(
    paginateQuery: PaginationQueryDto,
    repository: Repository<T>,
    options: PaginationOptions<T> = {},
  ) {
    const currentPage = paginateQuery.page ?? 1;
    const requestedLimit = paginateQuery.limit ?? 10;
    const limit = Math.min(requestedLimit, MAX_LIMIT);
    const order =
      options.order ?? (({ id: 'DESC' } as unknown) as FindOptionsOrder<T>);

    const results = await repository.find({
      skip: (currentPage - 1) * limit,
      take: limit,
      order,
    });

    const baseURL = `${this.request.protocol}://${this.request.get('host')}${this.request.path}`;
    const totalItems = await repository.count();
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

  private buildPageLink(
    baseURL: string,
    baseParams: URLSearchParams,
    page: number,
  ): string {
    const params = new URLSearchParams(baseParams);
    params.set('page', page.toString());
    return `${baseURL}?${params.toString()}`;
  }

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
