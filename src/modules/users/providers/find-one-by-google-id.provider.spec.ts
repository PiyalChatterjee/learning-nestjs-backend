import { Test, TestingModule } from '@nestjs/testing';
import { FindOneByGoogleIdProvider } from './find-one-by-google-id.provider';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../user.entity';

describe('FindOneByGoogleIdProvider', () => {
  let provider: FindOneByGoogleIdProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindOneByGoogleIdProvider,
        {
          provide: getRepositoryToken(User),
          useValue: {},
        },
      ],
    }).compile();

    provider = module.get<FindOneByGoogleIdProvider>(FindOneByGoogleIdProvider);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
