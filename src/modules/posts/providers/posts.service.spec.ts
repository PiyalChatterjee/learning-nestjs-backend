import { Test, TestingModule } from '@nestjs/testing';
import { PostsService } from './posts.service';
import { PostCreateManyProvider } from './post-create-many.provider';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Post } from '../post.entity';
import { User } from '../../users/user.entity';
import { MetaOption } from '../../meta-options/meta-option.entity';
import { TagRelationValidator } from '../../../common/validators/tag-relation.validator';

describe('PostsService', () => {
  let service: PostsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        {
          provide: getRepositoryToken(User),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Post),
          useValue: {},
        },
        {
          provide: getRepositoryToken(MetaOption),
          useValue: {},
        },
        {
          provide: TagRelationValidator,
          useValue: {
            resolveTagsOrThrow: jest.fn(),
          },
        },
        {
          provide: PostCreateManyProvider,
          useValue: {
            createManyPosts: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
