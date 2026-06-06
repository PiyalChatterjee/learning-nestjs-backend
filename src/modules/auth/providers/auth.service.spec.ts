import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInProvider } from './sign-in.provider';
import { RefreshTokensProvider } from './refresh-tokens.provider';

describe('AuthService', () => {
  let service: AuthService;
  let signInProvider: { signIn: jest.Mock };
  let refreshTokensProvider: { refreshTokens: jest.Mock };

  beforeEach(async () => {
    signInProvider = { signIn: jest.fn() };
    refreshTokensProvider = { refreshTokens: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: SignInProvider, useValue: signInProvider },
        { provide: RefreshTokensProvider, useValue: refreshTokensProvider },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('signIn', () => {
    it('should return tokens on valid credentials', async () => {
      const tokens = { message: 'Sign-in successful', accessToken: 'at', refreshToken: 'rt' };
      signInProvider.signIn.mockResolvedValue(tokens);
      const result = await service.signIn({ email: 'a@b.com', password: 'pass' });
      expect(result).toEqual(tokens);
    });

    it('should propagate UnauthorizedException', async () => {
      signInProvider.signIn.mockRejectedValue(new UnauthorizedException('Invalid email or password'));
      await expect(service.signIn({ email: 'a@b.com', password: 'wrong' })).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshTokens', () => {
    it('should return new tokens', async () => {
      const tokens = { email: 'a@b.com', accessToken: 'at2', refreshToken: 'rt2' };
      refreshTokensProvider.refreshTokens.mockResolvedValue(tokens);
      const result = await service.refreshTokens({ refreshToken: 'old-rt' });
      expect(result).toEqual(tokens);
    });

    it('should propagate UnauthorizedException on invalid token', async () => {
      refreshTokensProvider.refreshTokens.mockRejectedValue(new UnauthorizedException('Invalid refresh token'));
      await expect(service.refreshTokens({ refreshToken: 'bad' })).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('isAuthenticated', () => {
    it('should return true for a valid token', () => {
      expect(service.isAuthenticated('valid-token')).toBe(true);
    });

    it('should return false for an empty token', () => {
      expect(service.isAuthenticated('')).toBe(false);
    });
  });
});

