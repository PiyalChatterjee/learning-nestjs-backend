import { Test, TestingModule } from '@nestjs/testing';
import { SignInProvider } from './sign-in.provider';

describe('SignInProvider', () => {
  let provider: SignInProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SignInProvider],
    }).compile();

    provider = module.get<SignInProvider>(SignInProvider);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
