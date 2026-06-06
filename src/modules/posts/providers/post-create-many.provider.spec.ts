import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PostCreateManyProvider } from './post-create-many.provider';
import { Post } from '../post.entity';
import { User } from '../../users/user.entity';
import { MetaOption } from '../../meta-options/meta-option.entity';
import { TagRelationValidator } from '../../../common/validators/tag-relation.validator';
import { CreateManyPostsDto } from '../dtos/create-many-posts.dto';
import { IActiveUser } from '../../auth/interfaces/active-user.interface';
import { PostType } from '../enums/post-type.enum';
import { PostStatus } from '../enums/post-status.enum';

describe('PostCreateManyProvider', () => {
  let provider: PostCreateManyProvider;
  let dataSource: DataSource;
  let postRepository;
  let userRepository;
  let metaOptionRepository;
  let tagRelationValidator: jest.Mocked<TagRelationValidator>;
  let queryRunner;

  const mockActiveUser: IActiveUser = {
    sub: 1,
    email: 'test@example.com',
  };

  const mockUser: User = {
    id: 1,
    email: mockActiveUser.email,
    password: 'hashedPassword',
    firstName: 'Test',
    lastName: 'User',
    googleId: undefined,
    posts: [],
  };

  const mockTag = {
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

  beforeEach(async () => {
    // Create mock query runner
    queryRunner = {
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      manager: {
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
      },
    };

    // Create mocks
    dataSource = {
      createQueryRunner: jest.fn().mockReturnValue(queryRunner),
    } as any;

    postRepository = {};
    userRepository = {};
    metaOptionRepository = {};
    tagRelationValidator = {
      resolveTagsOrThrow: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostCreateManyProvider,
        {
          provide: DataSource,
          useValue: dataSource,
        },
        {
          provide: getRepositoryToken(Post),
          useValue: postRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
        {
          provide: getRepositoryToken(MetaOption),
          useValue: metaOptionRepository,
        },
        {
          provide: TagRelationValidator,
          useValue: tagRelationValidator,
        },
      ],
    }).compile();

    provider = module.get<PostCreateManyProvider>(PostCreateManyProvider);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createManyPosts', () => {
    it('should be defined', () => {
      expect(provider).toBeDefined();
    });

    it('should successfully create multiple posts in a transaction', async () => {
      const createManyPostsDto: CreateManyPostsDto = {
        posts: [
          {
            title: 'Test Post 1',
            slug: 'test-post-1',
            content: 'Content 1',
            tags: ['javascript'],
            postType: PostType.POST,
            status: PostStatus.PUBLISHED,
            publishOn: new Date('2026-06-01T10:00:00.000Z'),
            metaOption: {
              metaValue:
                '{"seo":{"canonicalUrl":"https://example.com/posts/getting-started-with-nestjs","index":true,"priority":0.9},"social":{"ogType":"article","twitterCard":"summary_large_image"},"keywords":["nestjs","typeorm","many-to-many"],"readingTimeMinutes":7,"isFeatured":true}',
            },
          },
          {
            title: 'Test Post 2',
            slug: 'test-post-2',
            content: 'Content 2',
            tags: ['javascript'],
            postType: PostType.POST,
            status: PostStatus.PUBLISHED,
            publishOn: new Date('2026-06-01T10:00:00.000Z'),
            metaOption: {
              metaValue:
                '{"seo":{"canonicalUrl":"https://example.com/posts/getting-started-with-nestjs","index":true,"priority":0.9},"social":{"ogType":"article","twitterCard":"summary_large_image"},"keywords":["nestjs","typeorm","many-to-many"],"readingTimeMinutes":7,"isFeatured":true}',
            },
          },
        ],
      };

      const mockPost1 = {
        id: 1,
        title: 'Test Post 1',
        slug: 'test-post-1',
        content: 'Content 1',
        author: mockUser,
        tags: [mockTag],
      };

      const mockPost2 = {
        id: 2,
        title: 'Test Post 2',
        slug: 'test-post-2',
        content: 'Content 2',
        author: mockUser,
        tags: [mockTag],
      };

      // Setup mocks
      queryRunner.manager.findOne.mockResolvedValue(mockUser);
      tagRelationValidator.resolveTagsOrThrow.mockResolvedValue([mockTag]);
      queryRunner.manager.create.mockImplementation((entity, data) => ({
        ...data,
        author: mockUser,
        tags: [mockTag],
      }));
      queryRunner.manager.save.mockResolvedValue([mockPost1, mockPost2]);

      const result = await provider.createManyPosts(
        createManyPostsDto,
        mockActiveUser,
      );

      expect(result).toEqual([mockPost1, mockPost2]);
      expect(queryRunner.connect).toHaveBeenCalled();
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });

    it('should throw BadRequestException when batch is empty', async () => {
      const createManyPostsDto: CreateManyPostsDto = {
        posts: [],
      };

      await expect(
        provider.createManyPosts(createManyPostsDto, mockActiveUser),
      ).rejects.toThrow(
        new BadRequestException('Batch must contain at least one post'),
      );

      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });

    it('should throw BadRequestException when batch exceeds MAX_BATCH_SIZE', async () => {
      const posts = Array(51)
        .fill(null)
        .map((_, i) => ({
          title: `Post ${i}`,
          slug: `post-${i}`,
          content: `Content ${i}`,
        }));

      const createManyPostsDto = {
        posts,
      } as CreateManyPostsDto;

      await expect(
        provider.createManyPosts(createManyPostsDto, mockActiveUser),
      ).rejects.toThrow(
        new BadRequestException('Batch size cannot exceed 50 posts'),
      );

      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });

    it('should throw BadRequestException when batch contains duplicate slugs', async () => {
      const createManyPostsDto = {
        posts: [
          {
            title: 'Post 1',
            slug: 'duplicate-slug',
            content: 'Content 1',
          },
          {
            title: 'Post 2',
            slug: 'duplicate-slug',
            content: 'Content 2',
          },
        ],
      } as CreateManyPostsDto;

      await expect(
        provider.createManyPosts(createManyPostsDto, mockActiveUser),
      ).rejects.toThrow(
        new BadRequestException('Duplicate slug in batch: duplicate-slug'),
      );

      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });

    it('should rollback transaction on tag resolution error', async () => {
      const createManyPostsDto = {
        posts: [
          {
            title: 'Test Post',
            slug: 'test-post',
            content: 'Content',
            tags: ['nonexistent'],
          },
        ],
      } as CreateManyPostsDto;

      queryRunner.manager.findOne.mockResolvedValue(mockUser);
      tagRelationValidator.resolveTagsOrThrow.mockRejectedValue(
        new Error('Tag not found'),
      );

      await expect(
        provider.createManyPosts(createManyPostsDto, mockActiveUser),
      ).rejects.toThrow();

      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });

    it('should handle single post creation', async () => {
      const createManyPostsDto = {
        posts: [
          {
            title: 'Single Post',
            slug: 'single-post',
            content: 'Content',
          },
        ],
      } as CreateManyPostsDto;

      const mockPost = {
        id: 1,
        title: 'Single Post',
        slug: 'single-post',
        content: 'Content',
        author: mockUser,
      };

      queryRunner.manager.findOne.mockResolvedValue(mockUser);
      tagRelationValidator.resolveTagsOrThrow.mockResolvedValue([]);
      queryRunner.manager.create.mockReturnValue({ ...mockPost, tags: [] });
      queryRunner.manager.save.mockResolvedValue([mockPost]);

      const result = await provider.createManyPosts(
        createManyPostsDto,
        mockActiveUser,
      );

      expect(result).toEqual([mockPost]);
      expect(queryRunner.manager.save).toHaveBeenCalledTimes(1);
    });

    it('should resolve multiple tags per post', async () => {
      const createManyPostsDto = {
        posts: [
          {
            title: 'Multi-tag Post',
            slug: 'multi-tag-post',
            content: 'Content',
            tags: ['javascript', 'typescript'],
          },
        ],
      } as CreateManyPostsDto;

      const mockTag2 = {
        ...mockTag,
        id: 2,
        name: 'TypeScript',
        slug: 'typescript',
      };
      const mockTags = [mockTag, mockTag2];

      const mockPost = {
        id: 1,
        title: 'Multi-tag Post',
        slug: 'multi-tag-post',
        content: 'Content',
        author: mockUser,
        tags: mockTags,
      };

      queryRunner.manager.findOne.mockResolvedValue(mockUser);
      tagRelationValidator.resolveTagsOrThrow.mockResolvedValue(mockTags);
      queryRunner.manager.create.mockReturnValue(mockPost);
      queryRunner.manager.save.mockResolvedValue([mockPost]);

      const result = await provider.createManyPosts(
        createManyPostsDto,
        mockActiveUser,
      );

      expect(result).toEqual([mockPost]);
      expect(tagRelationValidator.resolveTagsOrThrow).toHaveBeenCalledWith([
        'javascript',
        'typescript',
      ]);
    });

    it('should always release query runner even on error', async () => {
      const createManyPostsDto: CreateManyPostsDto = {
        posts: [],
      };

      await expect(
        provider.createManyPosts(createManyPostsDto, mockActiveUser),
      ).rejects.toThrow();

      expect(queryRunner.release).toHaveBeenCalled();
    });
  });
});
