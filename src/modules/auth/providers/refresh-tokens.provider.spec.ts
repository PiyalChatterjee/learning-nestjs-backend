import { Test, TestingModule } from '@nestjs/testing';
import { RefreshTokensProvider } from './refresh-tokens.provider';

describe('RefreshTokensProvider', () => {
  let provider: RefreshTokensProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RefreshTokensProvider],
    }).compile();

    provider = module.get<RefreshTokensProvider>(RefreshTokensProvider);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
