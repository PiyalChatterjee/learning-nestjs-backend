import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CreatePostProvider } from './create-post.provider';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../../users/user.entity';
import { Post } from '../post.entity';
import { TagRelationValidator } from '../../../common/validators/tag-relation.validator';
import { PostType } from '../enums/post-type.enum';
import { PostStatus } from '../enums/post-status.enum';
import { IActiveUser } from '../../auth/interfaces/active-user.interface';

describe('CreatePostProvider', () => {
  let provider: CreatePostProvider;
  let userRepository: { findOne: jest.Mock };
  let postRepository: { create: jest.Mock; save: jest.Mock };
  let tagRelationValidator: { resolveTagsOrThrow: jest.Mock };

  const mockActiveUser: IActiveUser = { sub: 1, email: 'author@example.com' };

  const mockAuthor: User = {
    id: 1,
    email: 'author@example.com',
    firstName: 'Author',
    lastName: 'User',
    password: 'hashed',
    googleId: undefined,
    posts: [],
  };

  const mockTag = {
    id: 1,
    name: 'NestJS',
    slug: 'nestjs',
    description: null,
    schema: null,
    featureImageUrl: null,
    createDate: new Date(),
    updateDate: new Date(),
    deleteDate: null,
    posts: [],
  };

  beforeEach(async () => {
    userRepository = { findOne: jest.fn() };
    postRepository = { create: jest.fn(), save: jest.fn() };
    tagRelationValidator = { resolveTagsOrThrow: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreatePostProvider,
        { provide: getRepositoryToken(User), useValue: userRepository },
        { provide: getRepositoryToken(Post), useValue: postRepository },
        { provide: TagRelationValidator, useValue: tagRelationValidator },
      ],
    }).compile();

    provider = module.get<CreatePostProvider>(CreatePostProvider);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  describe('createPost', () => {
    const createPostDto = {
      title: 'Test Post',
      slug: 'test-post',
      content: 'Content',
      postType: PostType.POST,
      status: PostStatus.DRAFT,
      publishOn: new Date(),
      tags: ['nestjs'],
    };

    it('should create and return a formatted post', async () => {
      const mockPost = {
        id: 1,
        ...createPostDto,
        author: mockAuthor,
        tags: [mockTag],
        metaValue: null,
        schema: null,
        featuredImageUrl: null,
        createdAt: new Date(),
      };

      userRepository.findOne.mockResolvedValue(mockAuthor);
      tagRelationValidator.resolveTagsOrThrow.mockResolvedValue([mockTag]);
      postRepository.create.mockReturnValue(mockPost);
      postRepository.save.mockResolvedValue(mockPost);

      const result = await provider.createPost(createPostDto, mockActiveUser);
      expect(result).toBeDefined();
      expect(postRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when author not found', async () => {
      userRepository.findOne.mockResolvedValue(null);
      tagRelationValidator.resolveTagsOrThrow.mockResolvedValue([]);
      await expect(provider.createPost(createPostDto, mockActiveUser)).rejects.toThrow(NotFoundException);
    });

    it('should handle post with no tags', async () => {
      const dtoNoTags = { ...createPostDto, tags: [] };
      const mockPost = { id: 1, ...dtoNoTags, author: mockAuthor, tags: [], metaValue: null, schema: null, featuredImageUrl: null, createdAt: new Date() };

      userRepository.findOne.mockResolvedValue(mockAuthor);
      tagRelationValidator.resolveTagsOrThrow.mockResolvedValue([]);
      postRepository.create.mockReturnValue(mockPost);
      postRepository.save.mockResolvedValue(mockPost);

      const result = await provider.createPost(dtoNoTags, mockActiveUser);
      expect(result).toBeDefined();
    });

    it('should handle post with metaOption', async () => {
      const dtoWithMeta = { ...createPostDto, metaOption: { metaValue: '{"key":"val"}' } };
      const mockPost = { id: 1, ...dtoWithMeta, author: mockAuthor, tags: [mockTag], metaValue: null, schema: null, featuredImageUrl: null, createdAt: new Date() };

      userRepository.findOne.mockResolvedValue(mockAuthor);
      tagRelationValidator.resolveTagsOrThrow.mockResolvedValue([mockTag]);
      postRepository.create.mockReturnValue(mockPost);
      postRepository.save.mockResolvedValue(mockPost);

      const result = await provider.createPost(dtoWithMeta, mockActiveUser);
      expect(result).toBeDefined();
    });
  });
});

