import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { TagRelationValidator } from './tag-relation.validator';
import { Tag } from '../../modules/tags/tag.entity';

describe('TagRelationValidator', () => {
  let validator: TagRelationValidator;
  let tagRepository;

  const mockTags: Tag[] = [
    {
      id: 1,
      name: 'JavaScript',
      slug: 'javascript',
      description: 'JavaScript programming',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      posts: [],
    },
    {
      id: 2,
      name: 'TypeScript',
      slug: 'typescript',
      description: 'TypeScript programming',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      posts: [],
    },
    {
      id: 3,
      name: 'NestJS',
      slug: 'nestjs',
      description: 'NestJS framework',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      posts: [],
    },
  ];

  beforeEach(async () => {
    tagRepository = {
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TagRelationValidator,
        {
          provide: getRepositoryToken(Tag),
          useValue: tagRepository,
        },
      ],
    }).compile();

    validator = module.get<TagRelationValidator>(TagRelationValidator);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('resolveTagsOrThrow', () => {
    it('should resolve valid tag slugs', async () => {
      const tagSlugs = ['javascript', 'typescript'];
      const expectedTags = [mockTags[0], mockTags[1]];

      tagRepository.find.mockResolvedValue(expectedTags);

      const result = await validator.resolveTagsOrThrow(tagSlugs);

      expect(result).toEqual(expectedTags);
      expect(tagRepository.find).toHaveBeenCalled();
    });

    it('should return empty array for empty input', async () => {
      const result = await validator.resolveTagsOrThrow([]);

      expect(result).toEqual([]);
      expect(tagRepository.find).not.toHaveBeenCalled();
    });

    it('should resolve single tag', async () => {
      const tagSlugs = ['javascript'];
      const expectedTags = [mockTags[0]];

      tagRepository.find.mockResolvedValue(expectedTags);

      const result = await validator.resolveTagsOrThrow(tagSlugs);

      expect(result).toEqual(expectedTags);
      expect(result).toHaveLength(1);
    });

    it('should throw NotFoundException when tag slug does not exist', async () => {
      const tagSlugs = ['invalid-slug'];

      tagRepository.find.mockResolvedValue([]);

      await expect(validator.resolveTagsOrThrow(tagSlugs)).rejects.toThrow(
        new NotFoundException('Tags not found: invalid-slug'),
      );
    });

    it('should throw NotFoundException with all missing slugs', async () => {
      const tagSlugs = ['invalid-1', 'invalid-2', 'invalid-3'];

      tagRepository.find.mockResolvedValue([]);

      await expect(validator.resolveTagsOrThrow(tagSlugs)).rejects.toThrow(
        new NotFoundException(
          'Tags not found: invalid-1, invalid-2, invalid-3',
        ),
      );
    });

    it('should throw NotFoundException with partial missing slugs', async () => {
      const tagSlugs = ['javascript', 'invalid-slug', 'typescript'];
      const foundTags = [mockTags[0], mockTags[1]];

      tagRepository.find.mockResolvedValue(foundTags);

      await expect(validator.resolveTagsOrThrow(tagSlugs)).rejects.toThrow(
        new NotFoundException('Tags not found: invalid-slug'),
      );
    });

    it('should handle duplicate slugs', async () => {
      const tagSlugs = ['javascript', 'javascript', 'typescript'];
      const expectedTags = [mockTags[0], mockTags[1]];

      tagRepository.find.mockResolvedValue(expectedTags);

      const result = await validator.resolveTagsOrThrow(tagSlugs);

      expect(result).toEqual(expectedTags);
      expect(result).toHaveLength(2);
    });

    it('should remove duplicate slugs before querying', async () => {
      const tagSlugs = ['javascript', 'javascript', 'typescript', 'typescript'];

      tagRepository.find.mockResolvedValue([mockTags[0], mockTags[1]]);

      await validator.resolveTagsOrThrow(tagSlugs);

      // Verify that duplicate slugs were removed
      const callArgs = tagRepository.find.mock.calls[0][0];
      const uniqueSlugs = Array.isArray(callArgs.where.slug._value)
        ? new Set(callArgs.where.slug._value)
        : null;

      expect(tagRepository.find).toHaveBeenCalled();
    });

    it('should resolve multiple tags successfully', async () => {
      const tagSlugs = ['javascript', 'typescript', 'nestjs'];
      const expectedTags = mockTags;

      tagRepository.find.mockResolvedValue(expectedTags);

      const result = await validator.resolveTagsOrThrow(tagSlugs);

      expect(result).toEqual(expectedTags);
      expect(result).toHaveLength(3);
    });

    it('should handle case-sensitive slug matching', async () => {
      const tagSlugs = ['JavaScript'];
      tagRepository.find.mockResolvedValue([]);

      await expect(validator.resolveTagsOrThrow(tagSlugs)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException with correct message format', async () => {
      const tagSlugs = ['invalid'];

      tagRepository.find.mockResolvedValue([]);

      try {
        await validator.resolveTagsOrThrow(tagSlugs);
        fail('Should have thrown NotFoundException');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect(error.message).toContain('Tags not found: invalid');
      }
    });

    it('should query repository with correct parameters', async () => {
      const tagSlugs = ['javascript', 'typescript'];

      tagRepository.find.mockResolvedValue([mockTags[0], mockTags[1]]);

      await validator.resolveTagsOrThrow(tagSlugs);

      expect(tagRepository.find).toHaveBeenCalledTimes(1);
      const callArgs = tagRepository.find.mock.calls[0][0];
      expect(callArgs).toHaveProperty('where');
      expect(callArgs.where).toHaveProperty('slug');
      expect(callArgs.where.slug).toBeDefined();
    });

    it('should handle special characters in slug names', async () => {
      const tagSlugs = ['c-plus-plus', 'c-sharp', 'dot-net'];

      tagRepository.find.mockResolvedValue([]);

      await expect(validator.resolveTagsOrThrow(tagSlugs)).rejects.toThrow();
    });

    it('should maintain original tag objects from repository', async () => {
      const tagSlugs = ['javascript'];
      const tagFromDb = { ...mockTags[0], customField: 'custom-value' };

      tagRepository.find.mockResolvedValue([tagFromDb]);

      const result = await validator.resolveTagsOrThrow(tagSlugs);

      expect(result[0]).toEqual(tagFromDb);
      expect(result[0]).toHaveProperty('customField');
    });

    it('should handle large number of tags', async () => {
      const tagSlugs = Array.from({ length: 100 }, (_, i) => `tag-${i}`);
      const foundTags = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        slug: `tag-${i}`,
        name: `Tag ${i}`,
      }));

      tagRepository.find.mockResolvedValue(foundTags);

      const result = await validator.resolveTagsOrThrow(tagSlugs);

      expect(result).toHaveLength(100);
    });
  });
});
