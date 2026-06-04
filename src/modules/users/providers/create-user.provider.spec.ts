import { Test, TestingModule } from '@nestjs/testing';
import { CreateUserProvider } from './create-user.provider';

describe('CreateUserProvider', () => {
  let provider: CreateUserProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CreateUserProvider],
    }).compile();

    provider = module.get<CreateUserProvider>(CreateUserProvider);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
