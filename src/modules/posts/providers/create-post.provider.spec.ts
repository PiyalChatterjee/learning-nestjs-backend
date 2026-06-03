import { Test, TestingModule } from '@nestjs/testing';
import { CreatePostProvider } from './create-post.provider';

describe('CreatePostProvider', () => {
  let provider: CreatePostProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CreatePostProvider],
    }).compile();

    provider = module.get<CreatePostProvider>(CreatePostProvider);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
