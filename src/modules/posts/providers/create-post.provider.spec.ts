import { Test, TestingModule } from '@nestjs/testing';
import { CreatePostProvider } from './create-post.provider';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../../users/user.entity';
import { Post } from '../post.entity';
import { TagRelationValidator } from '../../../common/validators/tag-relation.validator';

describe('CreatePostProvider', () => {
  let provider: CreatePostProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreatePostProvider,
        {
          provide: getRepositoryToken(User),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Post),
          useValue: {},
        },
        {
          provide: TagRelationValidator,
          useValue: { resolveTagsOrThrow: jest.fn() },
        },
      ],
    }).compile();

    provider = module.get<CreatePostProvider>(CreatePostProvider);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
