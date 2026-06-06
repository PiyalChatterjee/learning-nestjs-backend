import { Test, TestingModule } from '@nestjs/testing';
import { RefreshTokensProvider } from './refresh-tokens.provider';
import { UsersService } from '../../users/providers/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { GenerateTokensProvider } from './generate-tokens.provider';

describe('RefreshTokensProvider', () => {
  let provider: RefreshTokensProvider;
  let jwtService: { verifyAsync: jest.Mock };
  let usersService: { findOneById: jest.Mock };
  let generateTokensProvider: { generateTokens: jest.Mock };

  beforeEach(async () => {
    jwtService = {
      verifyAsync: jest.fn(),
    };

    usersService = {
      findOneById: jest.fn(),
    };

    generateTokensProvider = {
      generateTokens: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshTokensProvider,
        {
          provide: UsersService,
          useValue: usersService,
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-value'),
          },
        },
        {
          provide: GenerateTokensProvider,
          useValue: generateTokensProvider,
        },
      ],
    }).compile();

    provider = module.get<RefreshTokensProvider>(RefreshTokensProvider);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  it('should verify refresh token and issue new tokens using token subject', async () => {
    const tokenDto = { refreshToken: 'refresh-token-value' };
    const mockUser = {
      id: 42,
      email: 'user@example.com',
    };
    const tokenPair = {
      email: 'user@example.com',
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    };

    jwtService.verifyAsync.mockResolvedValue({ sub: 42 });
    usersService.findOneById.mockResolvedValue(mockUser);
    generateTokensProvider.generateTokens.mockResolvedValue(tokenPair);

    await expect(provider.refreshTokens(tokenDto)).resolves.toEqual(tokenPair);
    expect(jwtService.verifyAsync).toHaveBeenCalledWith(
      tokenDto.refreshToken,
      expect.objectContaining({
        secret: 'test-value',
        audience: 'test-value',
        issuer: 'test-value',
      }),
    );
    expect(usersService.findOneById).toHaveBeenCalledWith(42);
    expect(generateTokensProvider.generateTokens).toHaveBeenCalledWith(
      mockUser,
    );
  });

  it('should throw for a token with non-existent subject user', async () => {
    jwtService.verifyAsync.mockResolvedValue({ sub: 99 });
    usersService.findOneById.mockResolvedValue(null);

    await expect(
      provider.refreshTokens({ refreshToken: 'refresh-token-value' }),
    ).rejects.toBeDefined();
  });
});
