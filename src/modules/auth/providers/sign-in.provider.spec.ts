import { Test, TestingModule } from '@nestjs/testing';
import { SignInProvider } from './sign-in.provider';
import { FindOneUserByEmailProvider } from '../../users/providers/find-one-user-by-email.provider';
import { HashingProvider } from './hashing.provider';
import { GenerateTokensProvider } from './generate-tokens.provider';

describe('SignInProvider', () => {
  let provider: SignInProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SignInProvider,
        {
          provide: FindOneUserByEmailProvider,
          useValue: { findOneByEmail: jest.fn() },
        },
        {
          provide: HashingProvider,
          useValue: { comparePassword: jest.fn() },
        },
        {
          provide: GenerateTokensProvider,
          useValue: { generateTokens: jest.fn() },
        },
      ],
    }).compile();

    provider = module.get<SignInProvider>(SignInProvider);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
