import { Test, TestingModule } from '@nestjs/testing';
import { HashingProvider } from './hashing.provider';

class TestHashingProvider extends HashingProvider {
  async hashPassword(data: string | Buffer): Promise<string> {
    return 'hashed';
  }

  async comparePassword(
    data: string | Buffer,
    encrypted: string,
  ): Promise<boolean> {
    return true;
  }
}

describe('HashingProvider', () => {
  let provider: TestHashingProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: HashingProvider,
          useClass: TestHashingProvider,
        },
      ],
    }).compile();

    provider = module.get<TestHashingProvider>(HashingProvider);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
