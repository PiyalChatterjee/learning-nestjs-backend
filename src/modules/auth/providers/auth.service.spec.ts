import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { SignInProvider } from './sign-in.provider';
import { RefreshTokensProvider } from './refresh-tokens.provider';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: SignInProvider,
          useValue: {
            signIn: jest.fn(),
          },
        },
        {
          provide: RefreshTokensProvider,
          useValue: {
            refreshTokens: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
