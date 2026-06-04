import { Test, TestingModule } from '@nestjs/testing';
import { GenerateTokensProvider } from './generate-tokens.provider';

describe('GenerateTokensProvider', () => {
  let provider: GenerateTokensProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GenerateTokensProvider],
    }).compile();

    provider = module.get<GenerateTokensProvider>(GenerateTokensProvider);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
