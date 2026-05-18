import { Test, TestingModule } from '@nestjs/testing';
import { PostsService } from './posts.service';
import { UsersService } from '../../users/provider/users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Post } from '../post.entity';
import { User } from '../../users/user.entity';

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
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
