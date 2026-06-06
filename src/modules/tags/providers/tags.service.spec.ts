import { Test, TestingModule } from '@nestjs/testing';
import { TagsService } from './tags.service';
import { TagCreateManyProvider } from './tag-create-many.provider';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Tag } from '../tag.entity';
import { Post } from '../../posts/post.entity';
import { PaginationProvider } from '../../../common/paginations/provider/pagination.provider';
import { NotFoundException } from '@nestjs/common';
import { PostStatus } from '../../posts/enums/post-status.enum';
import { PostTagDto } from '../dtos/post-tag.dto';
import { CreateManyTagsDto } from '../dtos/create-many-tags.dto';
import { GetTagsDto } from '../dtos/get-tags.dto';
import { SortOrder } from '../../../common/paginations/enums/sort-order.enum';

describe('TagsService', () => {
  let service: TagsService;
  let tagRepository;
  let postRepository;
  let tagCreateManyProvider;
  let paginationProvider;

  const mockTag: Tag = {
    id: 1,
    name: 'JavaScript',
    slug: 'javascript',
    description: 'JavaScript posts',
    schema: null,
    featureImageUrl: null,
    createDate: new Date(),
    updateDate: new Date(),
    deleteDate: null,
    posts: [],
  };

  const mockPost: Post = {
    id: 1,
    title: 'Test Post',
    postType: null,
    slug: 'test-post',
    status: PostStatus.DRAFT,
    content: 'Test content',
    schema: null,
    featuredImageUrl: null,
    publishOn: null,
    author: null,
    tags: [mockTag],
    metaValue: null,
    createdAt: new Date(),
  } as unknown as Post;

  beforeEach(async () => {
    tagRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      softRemove: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    postRepository = {
      createQueryBuilder: jest.fn(),
    };

    tagCreateManyProvider = {
      createManyTags: jest.fn(),
    };

    paginationProvider = {
      paginateQuery: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TagsService,
        {
          provide: getRepositoryToken(Tag),
          useValue: tagRepository,
        },
        {
          provide: getRepositoryToken(Post),
          useValue: postRepository,
        },
        {
          provide: TagCreateManyProvider,
          useValue: tagCreateManyProvider,
        },
        {
          provide: PaginationProvider,
          useValue: paginationProvider,
        },
      ],
    }).compile();

    service = module.get<TagsService>(TagsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('service initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });

  describe('createTag', () => {
    it('should create and persist a tag', async () => {
      const postTagDto: PostTagDto = {
        name: 'JavaScript',
        slug: 'javascript',
        description: 'JavaScript posts',
      };

      tagRepository.create.mockReturnValue(mockTag);
      tagRepository.save.mockResolvedValue(mockTag);

      const result = await service.createTag(postTagDto);

      expect(result).toEqual(mockTag);
      expect(tagRepository.create).toHaveBeenCalledWith(postTagDto);
      expect(tagRepository.save).toHaveBeenCalledWith(mockTag);
    });

    it('should throw error if repository save fails', async () => {
      const postTagDto: PostTagDto = {
        name: 'JavaScript',
        slug: 'javascript',
      };

      tagRepository.create.mockReturnValue(mockTag);
      tagRepository.save.mockRejectedValue(new Error('Database error'));

      await expect(service.createTag(postTagDto)).rejects.toThrow();
    });
  });

  describe('createManyTags', () => {
    it('should delegate to tagCreateManyProvider', async () => {
      const createManyTagsDto: CreateManyTagsDto = {
        tags: [
          {
            name: 'JavaScript',
            slug: 'javascript',
            description: 'JavaScript posts',
          },
          {
            name: 'TypeScript',
            slug: 'typescript',
            description: 'TypeScript posts',
          },
        ],
      };

      const mockTags = [
        mockTag,
        { ...mockTag, id: 2, name: 'TypeScript', slug: 'typescript' },
      ];

      tagCreateManyProvider.createManyTags.mockResolvedValue(mockTags);

      const result = await service.createManyTags(createManyTagsDto);

      expect(result).toEqual(mockTags);
      expect(tagCreateManyProvider.createManyTags).toHaveBeenCalledWith(
        createManyTagsDto,
      );
    });
  });

  describe('getAllTags', () => {
    it('should return paginated tags with default pagination', async () => {
      const getTagsDto: GetTagsDto = {};
      const mockPaginatedResult = {
        data: [mockTag],
        total: 1,
        page: 1,
        limit: 10,
      };

      paginationProvider.paginateQuery.mockResolvedValue(mockPaginatedResult);

      const result = await service.getAllTags(getTagsDto);

      expect(result.data).toHaveLength(1);
      expect(paginationProvider.paginateQuery).toHaveBeenCalled();
    });

    it('should search tags by name', async () => {
      const getTagsDto: GetTagsDto = {
        search: 'java',
      };

      const mockPaginatedResult = {
        data: [mockTag],
        total: 1,
        page: 1,
        limit: 10,
      };

      paginationProvider.paginateQuery.mockResolvedValue(mockPaginatedResult);

      const result = await service.getAllTags(getTagsDto);

      expect(result.data).toHaveLength(1);
      expect(paginationProvider.paginateQuery).toHaveBeenCalled();
    });

    it('should sort tags by allowed field', async () => {
      const getTagsDto: GetTagsDto = {
        sortBy: 'name',
        sortOrder: SortOrder.Ascending,
      };

      const mockPaginatedResult = {
        data: [mockTag],
        total: 1,
        page: 1,
        limit: 10,
      };

      paginationProvider.paginateQuery.mockResolvedValue(mockPaginatedResult);

      const result = await service.getAllTags(getTagsDto);

      expect(result.data).toHaveLength(1);
    });

    it('should handle pagination parameters', async () => {
      const getTagsDto: GetTagsDto = {
        page: 2,
        limit: 20,
      };

      const mockPaginatedResult = {
        data: [mockTag],
        meta: {
          totalItems: 50,
          itemsPerPage: 20,
          totalPages: 3,
          currentPage: 2,
        },
        links: {
          first: '',
          previous: null,
          next: null,
          last: '',
          current: '',
        },
      };

      paginationProvider.paginateQuery.mockResolvedValue(mockPaginatedResult);

      const result = await service.getAllTags(getTagsDto);

      expect(result.meta.currentPage).toBe(2);
      expect(result.meta.itemsPerPage).toBe(20);
    });
  });

  describe('getTagWithPosts', () => {
    it('should return a tag with its associated posts', async () => {
      const mockQueryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockPost]),
      };

      tagRepository.findOne.mockResolvedValue(mockTag);
      postRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getTagWithPosts(1);

      expect(result.tag).toEqual(mockTag);
      expect(result.posts).toHaveLength(1);
      expect(result.posts[0]).toEqual(mockPost);
    });

    it('should throw NotFoundException when tag does not exist', async () => {
      tagRepository.findOne.mockResolvedValue(null);

      await expect(service.getTagWithPosts(999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return empty posts array if tag has no posts', async () => {
      const mockQueryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      tagRepository.findOne.mockResolvedValue(mockTag);
      postRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getTagWithPosts(1);

      expect(result.tag).toEqual(mockTag);
      expect(result.posts).toHaveLength(0);
    });

    it('should properly join posts and posts.author', async () => {
      const mockQueryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockPost]),
      };

      tagRepository.findOne.mockResolvedValue(mockTag);
      postRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.getTagWithPosts(1);

      expect(postRepository.createQueryBuilder).toHaveBeenCalledWith('post');
      expect(mockQueryBuilder.innerJoin).toHaveBeenCalled();
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalled();
    });
  });

  describe('deleteTag', () => {
    it('should soft-delete a tag by id', async () => {
      tagRepository.findOne.mockResolvedValue(mockTag);
      tagRepository.softRemove.mockResolvedValue(mockTag);

      const result = await service.deleteTag(1);

      expect(result).toEqual({
        message: 'Tag with id 1 deleted successfully',
      });
      expect(tagRepository.softRemove).toHaveBeenCalledWith(mockTag);
    });

    it('should throw NotFoundException when tag does not exist', async () => {
      tagRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteTag(999)).rejects.toThrow(NotFoundException);
    });

    it('should throw error if soft delete fails', async () => {
      tagRepository.findOne.mockResolvedValue(mockTag);
      tagRepository.softRemove.mockRejectedValue(new Error('Database error'));

      await expect(service.deleteTag(1)).rejects.toThrow();
    });
  });
});
