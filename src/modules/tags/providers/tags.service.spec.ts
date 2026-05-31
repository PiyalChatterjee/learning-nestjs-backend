import { Test, TestingModule } from '@nestjs/testing';
import { TagsService } from './tags.service';
import { TagCreateManyProvider } from './tag-create-many.provider';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Tag } from '../tag.entity';
import { Post } from '../../posts/post.entity';
import { PaginationProvider } from '../../../common/paginations/provider/pagination.provider';

describe('TagsService', () => {
  let service: TagsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TagsService,
        {
          provide: getRepositoryToken(Tag),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Post),
          useValue: {},
        },
        {
          provide: TagCreateManyProvider,
          useValue: {
            createManyTags: jest.fn(),
          },
        },
        {
          provide: PaginationProvider,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<TagsService>(TagsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
