import { Test, TestingModule } from '@nestjs/testing';
import { GenerateTokensProvider } from './generate-tokens.provider';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

describe('GenerateTokensProvider', () => {
  let provider: GenerateTokensProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenerateTokensProvider,
        {
          provide: JwtService,
          useValue: { signAsync: jest.fn() },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn() },
        },
      ],
    }).compile();

    provider = module.get<GenerateTokensProvider>(GenerateTokensProvider);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
