import { Test, TestingModule } from '@nestjs/testing';
import { BcryptProvider } from './bcrypt.provider';

describe('BcryptProvider', () => {
  let provider: BcryptProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BcryptProvider],
    }).compile();

    provider = module.get<BcryptProvider>(BcryptProvider);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
