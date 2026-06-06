import { Test, TestingModule } from '@nestjs/testing';
import { SignInProvider } from './sign-in.provider';
import { FindOneUserByEmailProvider } from '../../users/providers/find-one-user-by-email.provider';
import { HashingProvider } from './hashing.provider';
import { GenerateTokensProvider } from './generate-tokens.provider';

describe('SignInProvider', () => {
  let provider: SignInProvider;
  let findOneUserByEmailProvider: { findOneByEmail: jest.Mock };
  let hashingProvider: { comparePassword: jest.Mock };
  let generateTokensProvider: { generateTokens: jest.Mock };

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    password: 'hashedPassword',
    firstName: 'Test',
    lastName: 'User',
  };

  beforeEach(async () => {
    findOneUserByEmailProvider = { findOneByEmail: jest.fn() };
    hashingProvider = { comparePassword: jest.fn() };
    generateTokensProvider = { generateTokens: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SignInProvider,
        { provide: FindOneUserByEmailProvider, useValue: findOneUserByEmailProvider },
        { provide: HashingProvider, useValue: hashingProvider },
        { provide: GenerateTokensProvider, useValue: generateTokensProvider },
      ],
    }).compile();

    provider = module.get<SignInProvider>(SignInProvider);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  describe('signIn', () => {
    it('should return tokens on valid credentials', async () => {
      findOneUserByEmailProvider.findOneByEmail.mockResolvedValue(mockUser);
      hashingProvider.comparePassword.mockResolvedValue(true);
      generateTokensProvider.generateTokens.mockResolvedValue({
        accessToken: 'at',
        refreshToken: 'rt',
        email: mockUser.email,
      });

      const result = await provider.signIn({ email: 'test@example.com', password: 'Pass123!' });
      expect(result).toEqual({ message: 'Sign-in successful', accessToken: 'at', refreshToken: 'rt' });
    });

    it('should throw when user not found', async () => {
      findOneUserByEmailProvider.findOneByEmail.mockResolvedValue(null);
      await expect(provider.signIn({ email: 'none@example.com', password: 'pass' }))
        .rejects.toThrow();
    });

    it('should throw when password is invalid', async () => {
      findOneUserByEmailProvider.findOneByEmail.mockResolvedValue(mockUser);
      hashingProvider.comparePassword.mockResolvedValue(false);
      await expect(provider.signIn({ email: 'test@example.com', password: 'wrong' }))
        .rejects.toThrow();
    });
  });
});

