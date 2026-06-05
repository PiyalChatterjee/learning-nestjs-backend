import { Test, TestingModule } from '@nestjs/testing';
import { CreateUserProvider } from './create-user.provider';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../user.entity';
import { HashingProvider } from '../../auth/providers/hashing.provider';

describe('CreateUserProvider', () => {
  let provider: CreateUserProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateUserProvider,
        {
          provide: getRepositoryToken(User),
          useValue: {},
        },
        {
          provide: HashingProvider,
          useValue: { hashPassword: jest.fn() },
        },
      ],
    }).compile();

    provider = module.get<CreateUserProvider>(CreateUserProvider);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
