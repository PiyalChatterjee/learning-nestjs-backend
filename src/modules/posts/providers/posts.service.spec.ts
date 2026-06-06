import { Test, TestingModule } from '@nestjs/testing';
import { PostsService } from './posts.service';
import { PostCreateManyProvider } from './post-create-many.provider';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Post } from '../post.entity';
import { User } from '../../users/user.entity';
import { MetaOption } from '../../meta-options/meta-option.entity';
import { TagRelationValidator } from '../../../common/validators/tag-relation.validator';
import { PaginationProvider } from '../../../common/paginations/provider/pagination.provider';
import { CreatePostProvider } from './create-post.provider';
import { NotFoundException } from '@nestjs/common';
import { CreatePostDto } from '../dtos/create-post.dto';
import { UpdatePostDto } from '../dtos/update-post.dto';
import { PatchPostDto } from '../dtos/patch-post.dto';
import { GetPostsDto } from '../dtos/get-posts.dto';
import { CreateManyPostsDto } from '../dtos/create-many-posts.dto';
import { PostStatus } from '../enums/post-status.enum';
import { SortOrder } from '../../../common/paginations/enums/sort-order.enum';
import { IActiveUser } from '../../auth/interfaces/active-user.interface';

describe('PostsService', () => {
  let service: PostsService;
  let postRepository;
  let userRepository;
  let metaOptionRepository;
  let tagRelationValidator;
  let postCreateManyProvider;
  let paginationProvider;
  let createPostProvider;

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    password: 'hashedPassword',
    googleId: undefined,
    posts: [],
  };

  const mockPost = {
    id: 1,
    title: 'Test Post',
    slug: 'test-post',
    content: 'Test content',
    status: PostStatus.DRAFT,
    author: mockUser,
    tags: [],
    createdAt: new Date(),
    publishOn: null,
  };

  beforeEach(async () => {
    postRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    userRepository = {
      findOne: jest.fn(),
    };

    metaOptionRepository = {
      create: jest.fn(),
      save: jest.fn(),
    };

    tagRelationValidator = {
      resolveTagsOrThrow: jest.fn(),
    };

    postCreateManyProvider = {
      createManyPosts: jest.fn(),
    };

    paginationProvider = {
      paginateQuery: jest.fn(),
    };

    createPostProvider = {
      createPost: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
        {
          provide: getRepositoryToken(Post),
          useValue: postRepository,
        },
        {
          provide: getRepositoryToken(MetaOption),
          useValue: metaOptionRepository,
        },
        {
          provide: TagRelationValidator,
          useValue: tagRelationValidator,
        },
        {
          provide: PostCreateManyProvider,
          useValue: postCreateManyProvider,
        },
        {
          provide: PaginationProvider,
          useValue: paginationProvider,
        },
        {
          provide: CreatePostProvider,
          useValue: createPostProvider,
        },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('service initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });

  describe('getAllPosts', () => {
    it('should return paginated posts with default pagination', async () => {
      const getPostsDto: GetPostsDto = {};
      const mockPaginatedResult = {
        data: [mockPost],
        total: 1,
        page: 1,
        limit: 10,
      };

      paginationProvider.paginateQuery.mockResolvedValue(mockPaginatedResult);

      const result = await service.getAllPosts(getPostsDto);

      expect(result.data).toHaveLength(1);
      expect(paginationProvider.paginateQuery).toHaveBeenCalled();
    });

    it('should filter posts by status', async () => {
      const getPostsDto: GetPostsDto = {
        status: PostStatus.PUBLISHED,
      };

      const mockPaginatedResult = {
        data: [{ ...mockPost, status: PostStatus.PUBLISHED }],
        total: 1,
        page: 1,
        limit: 10,
      };

      paginationProvider.paginateQuery.mockResolvedValue(mockPaginatedResult);

      const result = await service.getAllPosts(getPostsDto);

      expect(result.data).toHaveLength(1);
      expect(paginationProvider.paginateQuery).toHaveBeenCalled();
    });

    it('should search posts by title', async () => {
      const getPostsDto: GetPostsDto = {
        search: 'test',
      };

      const mockPaginatedResult = {
        data: [mockPost],
        total: 1,
        page: 1,
        limit: 10,
      };

      paginationProvider.paginateQuery.mockResolvedValue(mockPaginatedResult);

      const result = await service.getAllPosts(getPostsDto);

      expect(result.data).toHaveLength(1);
    });

    it('should filter posts by date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      const getPostsDto: GetPostsDto = {
        startDate,
        endDate,
      };

      const mockPaginatedResult = {
        data: [mockPost],
        total: 1,
        page: 1,
        limit: 10,
      };

      paginationProvider.paginateQuery.mockResolvedValue(mockPaginatedResult);

      const result = await service.getAllPosts(getPostsDto);

      expect(result.data).toHaveLength(1);
    });

    it('should sort posts by allowed field', async () => {
      const getPostsDto: GetPostsDto = {
        sortBy: 'title',
        sortOrder: SortOrder.Ascending,
      };

      const mockPaginatedResult = {
        data: [mockPost],
        total: 1,
        page: 1,
        limit: 10,
      };

      paginationProvider.paginateQuery.mockResolvedValue(mockPaginatedResult);

      const result = await service.getAllPosts(getPostsDto);

      expect(result.data).toHaveLength(1);
    });
  });

  describe('getPostById', () => {
    it('should return a post by id', async () => {
      postRepository.findOne.mockResolvedValue(mockPost);

      const result = await service.getPostById(1);

      expect(result).toBeDefined();
      expect(postRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should throw NotFoundException when post does not exist', async () => {
      postRepository.findOne.mockResolvedValue(null);

      await expect(service.getPostById(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('createPost', () => {
    it('should delegate to createPostProvider', async () => {
      const createPostDto = {
        title: 'New Post',
        slug: 'new-post',
        content: 'New content',
      } as CreatePostDto;

      const activeUser: IActiveUser = { sub: 1, email: 'test@example.com' };

      createPostProvider.createPost.mockResolvedValue(mockPost);

      const result = await service.createPost(createPostDto, activeUser);

      expect(result).toBeDefined();
      expect(createPostProvider.createPost).toHaveBeenCalledWith(
        createPostDto,
        activeUser,
      );
    });
  });

  describe('createManyPosts', () => {
    it('should create multiple posts', async () => {
      const createManyPostsDto = {
        posts: [
          {
            title: 'Post 1',
            slug: 'post-1',
            content: 'Content 1',
          },
          {
            title: 'Post 2',
            slug: 'post-2',
            content: 'Content 2',
          },
        ],
      } as CreateManyPostsDto;

      const activeUser: IActiveUser = { sub: 1, email: 'test@example.com' };

      postCreateManyProvider.createManyPosts.mockResolvedValue([
        mockPost,
        { ...mockPost, id: 2, title: 'Post 2' },
      ]);

      const result = await service.createManyPosts(
        createManyPostsDto,
        activeUser,
      );

      expect(result).toHaveLength(2);
      expect(postCreateManyProvider.createManyPosts).toHaveBeenCalledWith(
        createManyPostsDto,
        activeUser,
      );
    });
  });

  describe('updatePost', () => {
    it('should update a post with full replacement', async () => {
      const updatePostDto = {
        title: 'Updated Post',
        slug: 'updated-post',
        content: 'Updated content',
        status: PostStatus.PUBLISHED,
      } as UpdatePostDto;

      postRepository.findOne.mockResolvedValue(mockPost);
      postRepository.save.mockResolvedValue({
        ...mockPost,
        ...updatePostDto,
      });
      tagRelationValidator.resolveTagsOrThrow.mockResolvedValue([]);

      const result = await service.updatePost(1, updatePostDto);

      expect(result).toBeDefined();
      expect(postRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when post does not exist', async () => {
      const updatePostDto = {
        title: 'Updated',
        slug: 'updated',
        content: 'Updated',
      } as UpdatePostDto;

      postRepository.findOne.mockResolvedValue(null);

      await expect(service.updatePost(999, updatePostDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should update post meta options', async () => {
      const metaOption = {
        metaValue: '{"title":"Meta Title","description":"Meta Description"}',
      };

      const updatePostDto = {
        title: 'Updated',
        slug: 'updated',
        content: 'Updated',
        metaOption,
      } as UpdatePostDto;

      const mockMetaEntity = { id: 1, ...metaOption };

      postRepository.findOne.mockResolvedValue(mockPost);
      metaOptionRepository.create.mockReturnValue(mockMetaEntity);
      metaOptionRepository.save.mockResolvedValue(mockMetaEntity);
      postRepository.save.mockResolvedValue({
        ...mockPost,
        ...updatePostDto,
        metaValue: mockMetaEntity,
      });
      tagRelationValidator.resolveTagsOrThrow.mockResolvedValue([]);

      await service.updatePost(1, updatePostDto);

      // Since mockPost doesn't have an existing metaValue, it should create a new one
      expect(postRepository.save).toHaveBeenCalled();
    });

    it('should update post tags', async () => {
      const updatePostDto = {
        title: 'Updated',
        slug: 'updated',
        content: 'Updated',
        tags: ['javascript', 'typescript'],
      } as UpdatePostDto;

      const mockTags = [
        { id: 1, name: 'JavaScript', slug: 'javascript' },
        { id: 2, name: 'TypeScript', slug: 'typescript' },
      ];

      postRepository.findOne.mockResolvedValue(mockPost);
      postRepository.save.mockResolvedValue({
        ...mockPost,
        ...updatePostDto,
        tags: mockTags,
      });
      tagRelationValidator.resolveTagsOrThrow.mockResolvedValue(mockTags);

      const result = await service.updatePost(1, updatePostDto);

      expect(result).toBeDefined();
      expect(tagRelationValidator.resolveTagsOrThrow).toHaveBeenCalledWith([
        'javascript',
        'typescript',
      ]);
    });
  });

  describe('patchPost', () => {
    it('should patch a post with partial update', async () => {
      const patchPostDto: PatchPostDto = {
        title: 'Patched Title',
      };

      postRepository.findOne.mockResolvedValue(mockPost);
      postRepository.save.mockResolvedValue({
        ...mockPost,
        title: 'Patched Title',
      });

      const result = await service.patchPost(1, patchPostDto);

      expect(result).toBeDefined();
      expect(postRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when post does not exist', async () => {
      const patchPostDto: PatchPostDto = {
        title: 'Patched',
      };

      postRepository.findOne.mockResolvedValue(null);

      await expect(service.patchPost(999, patchPostDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should ignore undefined fields in patch', async () => {
      const patchPostDto: PatchPostDto = {
        title: 'Patched Title',
        content: undefined,
      };

      postRepository.findOne.mockResolvedValue(mockPost);
      postRepository.save.mockResolvedValue({
        ...mockPost,
        title: 'Patched Title',
      });

      const result = await service.patchPost(1, patchPostDto);

      expect(result).toBeDefined();
      expect(postRepository.save).toHaveBeenCalled();
    });

    it('should update post tags if provided', async () => {
      const patchPostDto: PatchPostDto = {
        tags: ['javascript'],
      };

      const mockTags = [{ id: 1, name: 'JavaScript', slug: 'javascript' }];

      postRepository.findOne.mockResolvedValue(mockPost);
      postRepository.save.mockResolvedValue({
        ...mockPost,
        tags: mockTags,
      });
      tagRelationValidator.resolveTagsOrThrow.mockResolvedValue(mockTags);

      const result = await service.patchPost(1, patchPostDto);

      expect(result).toBeDefined();
      expect(tagRelationValidator.resolveTagsOrThrow).toHaveBeenCalledWith([
        'javascript',
      ]);
    });

    it('should update post meta if provided', async () => {
      const metaOption = { metaValue: '{"title":"Meta Title"}' };
      const patchPostDto: PatchPostDto = {
        metaOption,
      };

      const mockMetaEntity = { id: 1, ...metaOption };
      const mockPostWithMeta = { ...mockPost, metaValue: mockMetaEntity };

      postRepository.findOne
        .mockResolvedValueOnce(mockPostWithMeta)
        .mockResolvedValueOnce(mockPostWithMeta);
      postRepository.save.mockResolvedValue(mockPostWithMeta);
      metaOptionRepository.save.mockResolvedValue(mockMetaEntity);

      await service.patchPost(1, patchPostDto);

      expect(metaOptionRepository.save).toHaveBeenCalled();
    });
  });

  describe('deletePost', () => {
    it('should delete a post by id', async () => {
      postRepository.findOne.mockResolvedValue(mockPost);
      postRepository.remove.mockResolvedValue(mockPost);

      const result = await service.deletePost(1);

      expect(result).toEqual({
        message: 'Post with id 1 deleted successfully',
      });
      expect(postRepository.remove).toHaveBeenCalledWith(mockPost);
    });

    it('should throw NotFoundException when post does not exist', async () => {
      postRepository.findOne.mockResolvedValue(null);

      await expect(service.deletePost(999)).rejects.toThrow(NotFoundException);
    });
  });
});
