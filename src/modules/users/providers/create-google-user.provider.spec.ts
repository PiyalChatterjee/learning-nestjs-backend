import { Test, TestingModule } from '@nestjs/testing';
import { CreateGoogleUserProvider } from './create-google-user.provider';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../user.entity';

describe('CreateGoogleUserProvider', () => {
  let provider: CreateGoogleUserProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateGoogleUserProvider,
        {
          provide: getRepositoryToken(User),
          useValue: {},
        },
      ],
    }).compile();

    provider = module.get<CreateGoogleUserProvider>(CreateGoogleUserProvider);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
