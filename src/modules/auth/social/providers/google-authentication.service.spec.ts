import { Test, TestingModule } from '@nestjs/testing';
import { GoogleAuthenticationService } from './google-authentication.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../../../users/providers/users.service';
import { GenerateTokensProvider } from '../../providers/generate-tokens.provider';

const mockVerifyIdToken = jest.fn();

jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    verifyIdToken: mockVerifyIdToken,
  })),
}));

describe('GoogleAuthenticationService', () => {
  let service: GoogleAuthenticationService;
  let usersService: {
    findOneByGoogleId: jest.Mock;
    findOneByEmail: jest.Mock;
    linkGoogleAccount: jest.Mock;
    createGoogleUser: jest.Mock;
  };
  let generateTokensProvider: { generateTokens: jest.Mock };

  beforeEach(async () => {
    mockVerifyIdToken.mockReset();

    usersService = {
      findOneByGoogleId: jest.fn(),
      findOneByEmail: jest.fn(),
      linkGoogleAccount: jest.fn(),
      createGoogleUser: jest.fn(),
    };

    generateTokensProvider = {
      generateTokens: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleAuthenticationService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('google-client-id'),
          },
        },
        {
          provide: JwtService,
          useValue: {},
        },
        {
          provide: UsersService,
          useValue: usersService,
        },
        {
          provide: GenerateTokensProvider,
          useValue: generateTokensProvider,
        },
      ],
    }).compile();

    service = module.get<GoogleAuthenticationService>(
      GoogleAuthenticationService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('returns tokens for an existing google-linked user', async () => {
    const existingUser = {
      id: 7,
      email: 'linked@example.com',
      googleId: 'gid-7',
    };
    const tokenPair = {
      accessToken: 'a',
      refreshToken: 'r',
      email: existingUser.email,
    };

    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({
        sub: 'gid-7',
        email: 'linked@example.com',
        email_verified: true,
      }),
    });
    usersService.findOneByGoogleId.mockResolvedValue(existingUser);
    generateTokensProvider.generateTokens.mockResolvedValue(tokenPair);

    await expect(service.authenticate({ token: 'id-token' })).resolves.toEqual(
      tokenPair,
    );
    expect(usersService.findOneByGoogleId).toHaveBeenCalledWith('gid-7');
    expect(usersService.findOneByEmail).not.toHaveBeenCalled();
  });

  it('links an existing email account when googleId is missing', async () => {
    const emailUser = { id: 11, email: 'existing@example.com', googleId: null };
    const linkedUser = { ...emailUser, googleId: 'gid-11' };
    const tokenPair = {
      accessToken: 'a2',
      refreshToken: 'r2',
      email: linkedUser.email,
    };

    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({
        sub: 'gid-11',
        email: 'existing@example.com',
        email_verified: true,
      }),
    });
    usersService.findOneByGoogleId.mockResolvedValue(null);
    usersService.findOneByEmail.mockResolvedValue(emailUser);
    usersService.linkGoogleAccount.mockResolvedValue(linkedUser);
    generateTokensProvider.generateTokens.mockResolvedValue(tokenPair);

    await expect(service.authenticate({ token: 'id-token' })).resolves.toEqual(
      tokenPair,
    );
    expect(usersService.linkGoogleAccount).toHaveBeenCalledWith(11, 'gid-11');
    expect(usersService.createGoogleUser).not.toHaveBeenCalled();
  });

  it('auto-provisions when user does not exist by googleId or email', async () => {
    const newUser = { id: 13, email: 'new@example.com', googleId: 'gid-13' };
    const tokenPair = {
      accessToken: 'a3',
      refreshToken: 'r3',
      email: newUser.email,
    };

    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({
        sub: 'gid-13',
        email: 'new@example.com',
        email_verified: true,
        given_name: 'New',
        family_name: 'User',
      }),
    });
    usersService.findOneByGoogleId.mockResolvedValue(null);
    usersService.findOneByEmail.mockResolvedValue(null);
    usersService.createGoogleUser.mockResolvedValue(newUser);
    generateTokensProvider.generateTokens.mockResolvedValue(tokenPair);

    await expect(service.authenticate({ token: 'id-token' })).resolves.toEqual(
      tokenPair,
    );
    expect(usersService.createGoogleUser).toHaveBeenCalledWith({
      email: 'new@example.com',
      firstName: 'New',
      lastName: 'User',
      googleId: 'gid-13',
    });
  });

  it('rejects unverified google email before provisioning', async () => {
    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({
        sub: 'gid-401',
        email: 'unverified@example.com',
        email_verified: false,
      }),
    });

    await expect(
      service.authenticate({ token: 'id-token' }),
    ).rejects.toBeDefined();
    expect(usersService.findOneByGoogleId).not.toHaveBeenCalled();
  });
});
