import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TagCreateManyProvider } from './tag-create-many.provider';
import { Tag } from '../tag.entity';
import { CreateManyTagsDto } from '../dtos/create-many-tags.dto';

describe('TagCreateManyProvider', () => {
  let provider: TagCreateManyProvider;
  let dataSource: DataSource;
  let tagRepository;
  let queryRunner;

  beforeEach(async () => {
    // Create mock query runner
    queryRunner = {
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      manager: {
        create: jest.fn(),
        save: jest.fn(),
      },
    };

    // Create mocks
    dataSource = {
      createQueryRunner: jest.fn().mockReturnValue(queryRunner),
    } as any;

    tagRepository = {};

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TagCreateManyProvider,
        {
          provide: DataSource,
          useValue: dataSource,
        },
        {
          provide: getRepositoryToken(Tag),
          useValue: tagRepository,
        },
      ],
    }).compile();

    provider = module.get<TagCreateManyProvider>(TagCreateManyProvider);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createManyTags', () => {
    it('should be defined', () => {
      expect(provider).toBeDefined();
    });

    it('should successfully create multiple tags in a transaction', async () => {
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

      const mockTag1 = {
        id: 1,
        name: 'JavaScript',
        slug: 'javascript',
        description: 'JavaScript posts',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockTag2 = {
        id: 2,
        name: 'TypeScript',
        slug: 'typescript',
        description: 'TypeScript posts',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Setup mocks
      queryRunner.manager.create
        .mockReturnValueOnce(mockTag1)
        .mockReturnValueOnce(mockTag2);
      queryRunner.manager.save.mockResolvedValue([mockTag1, mockTag2]);

      const result = await provider.createManyTags(createManyTagsDto);

      expect(result).toEqual([mockTag1, mockTag2]);
      expect(queryRunner.connect).toHaveBeenCalled();
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });

    it('should throw BadRequestException when batch is empty', async () => {
      const createManyTagsDto: CreateManyTagsDto = {
        tags: [],
      };

      await expect(provider.createManyTags(createManyTagsDto)).rejects.toThrow(
        new BadRequestException('Batch must contain at least one tag'),
      );

      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });

    it('should throw BadRequestException when batch exceeds MAX_BATCH_SIZE (100)', async () => {
      const tags = Array(101)
        .fill(null)
        .map((_, i) => ({
          name: `Tag ${i}`,
          slug: `tag-${i}`,
          description: `Description ${i}`,
        }));

      const createManyTagsDto: CreateManyTagsDto = {
        tags,
      };

      await expect(provider.createManyTags(createManyTagsDto)).rejects.toThrow(
        new BadRequestException('Batch size cannot exceed 100 tags'),
      );

      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });

    it('should throw BadRequestException when batch contains duplicate slugs', async () => {
      const createManyTagsDto: CreateManyTagsDto = {
        tags: [
          {
            name: 'Tag 1',
            slug: 'duplicate-slug',
            description: 'Description 1',
          },
          {
            name: 'Tag 2',
            slug: 'duplicate-slug',
            description: 'Description 2',
          },
        ],
      };

      await expect(provider.createManyTags(createManyTagsDto)).rejects.toThrow(
        new BadRequestException('Duplicate slug in batch: duplicate-slug'),
      );

      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });

    it('should rollback transaction on save error', async () => {
      const createManyTagsDto: CreateManyTagsDto = {
        tags: [
          {
            name: 'Test Tag',
            slug: 'test-tag',
            description: 'Test',
          },
        ],
      };

      const mockTag = {
        id: undefined,
        name: 'Test Tag',
        slug: 'test-tag',
        description: 'Test',
      };

      queryRunner.manager.create.mockReturnValue(mockTag);
      queryRunner.manager.save.mockRejectedValue(new Error('Database error'));

      await expect(
        provider.createManyTags(createManyTagsDto),
      ).rejects.toThrow();

      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });

    it('should handle single tag creation', async () => {
      const createManyTagsDto: CreateManyTagsDto = {
        tags: [
          {
            name: 'Single Tag',
            slug: 'single-tag',
            description: 'Single',
          },
        ],
      };

      const mockTag = {
        id: 1,
        name: 'Single Tag',
        slug: 'single-tag',
        description: 'Single',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      queryRunner.manager.create.mockReturnValue(mockTag);
      queryRunner.manager.save.mockResolvedValue([mockTag]);

      const result = await provider.createManyTags(createManyTagsDto);

      expect(result).toEqual([mockTag]);
      expect(queryRunner.manager.save).toHaveBeenCalledTimes(1);
    });

    it('should handle maximum batch size (100 tags)', async () => {
      const tags = Array(100)
        .fill(null)
        .map((_, i) => ({
          name: `Tag ${i}`,
          slug: `tag-${i}`,
          description: `Description ${i}`,
        }));

      const createManyTagsDto: CreateManyTagsDto = {
        tags,
      };

      const mockTags = tags.map((tag, i) => ({
        id: i + 1,
        ...tag,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      queryRunner.manager.create.mockImplementation((_, data) => data);
      queryRunner.manager.save.mockResolvedValue(mockTags);

      const result = await provider.createManyTags(createManyTagsDto);

      expect(result).toHaveLength(100);
      expect(queryRunner.manager.save).toHaveBeenCalled();
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('should always release query runner even on error', async () => {
      const createManyTagsDto: CreateManyTagsDto = {
        tags: [],
      };

      await expect(
        provider.createManyTags(createManyTagsDto),
      ).rejects.toThrow();

      expect(queryRunner.release).toHaveBeenCalled();
    });

    it('should detect duplicate slugs across different positions in batch', async () => {
      const createManyTagsDto: CreateManyTagsDto = {
        tags: [
          {
            name: 'Tag 1',
            slug: 'first-tag',
            description: 'First',
          },
          {
            name: 'Tag 2',
            slug: 'second-tag',
            description: 'Second',
          },
          {
            name: 'Tag 3',
            slug: 'first-tag',
            description: 'Duplicate First',
          },
        ],
      };

      await expect(provider.createManyTags(createManyTagsDto)).rejects.toThrow(
        new BadRequestException('Duplicate slug in batch: first-tag'),
      );

      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should create tags with various description lengths', async () => {
      const createManyTagsDto: CreateManyTagsDto = {
        tags: [
          {
            name: 'Short',
            slug: 'short-desc',
            description: 'x',
          },
          {
            name: 'Long',
            slug: 'long-desc',
            description: 'This is a much longer description with more details',
          },
          {
            name: 'Empty',
            slug: 'no-desc',
            description: '',
          },
        ],
      };

      const mockTags = createManyTagsDto.tags.map((tag, i) => ({
        id: i + 1,
        ...tag,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      queryRunner.manager.create.mockImplementation((_, data) => data);
      queryRunner.manager.save.mockResolvedValue(mockTags);

      const result = await provider.createManyTags(createManyTagsDto);

      expect(result).toHaveLength(3);
      expect(result[0].description).toBe('x');
      expect(result[2].description).toBe('');
    });
  });
});
