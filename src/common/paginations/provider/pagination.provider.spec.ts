import { Test, TestingModule } from '@nestjs/testing';
import { PaginationProvider } from './pagination.provider';
import { REQUEST } from '@nestjs/core';
import { Repository } from 'typeorm';
import { Request } from 'express';

describe('PaginationProvider', () => {
  let provider: PaginationProvider;
  let request: Request;
  let repository: Repository<{ id: number }>;

  const find = jest.fn();
  const count = jest.fn();

  beforeEach(async () => {
    request = {
      protocol: 'http',
      get: jest.fn().mockReturnValue('localhost:8000'),
      path: '/v1/users',
      query: {},
    } as unknown as Request;

    repository = {
      find,
      count,
    } as unknown as Repository<{ id: number }>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaginationProvider,
        {
          provide: REQUEST,
          useValue: request,
        },
      ],
    }).compile();

    provider = module.get<PaginationProvider>(PaginationProvider);
    find.mockReset();
    count.mockReset();
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  it('caps limit to maximum supported value', async () => {
    find.mockResolvedValue([{ id: 1 }]);
    count.mockResolvedValue(1);

    const response = await provider.paginateQuery(
      {
        page: 1,
        limit: 999,
      },
      repository,
      {
        order: { id: 'DESC' },
      },
    );

    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
        take: 100,
        order: { id: 'DESC' },
      }),
    );
    expect(response.meta.itemsPerPage).toBe(100);
  });

  it('returns empty-safe pagination metadata for zero results', async () => {
    find.mockResolvedValue([]);
    count.mockResolvedValue(0);

    const response = await provider.paginateQuery(
      {
        page: 1,
        limit: 10,
      },
      repository,
    );

    expect(response.meta.totalItems).toBe(0);
    expect(response.meta.totalPages).toBe(1);
    expect(response.links.previous).toBeNull();
    expect(response.links.next).toBeNull();
    expect(response.links.last).toContain('page=1');
  });

  it('preserves non-pagination query parameters in generated links', async () => {
    find.mockResolvedValue([{ id: 9 }]);
    count.mockResolvedValue(20);
    request.query = {
      status: 'published',
      sort: 'title',
      page: '4',
      limit: '5',
    };

    const response = await provider.paginateQuery(
      {
        page: 2,
        limit: 5,
      },
      repository,
    );

    expect(response.links.current).toContain('status=published');
    expect(response.links.current).toContain('sort=title');
    expect(response.links.current).toContain('limit=5');
    expect(response.links.current).toContain('page=2');
  });

  it('uses deterministic default order when no order option is provided', async () => {
    find.mockResolvedValue([{ id: 1 }]);
    count.mockResolvedValue(1);

    await provider.paginateQuery(
      {
        page: 1,
        limit: 10,
      },
      repository,
    );

    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        order: { id: 'DESC' },
      }),
    );
  });
});
