import { Test, TestingModule } from '@nestjs/testing';
import { UserCreateManyProvider } from './user-create-many.provider';
import { DataSource } from 'typeorm';
import { HashingProvider } from '../../auth/providers/hashing.provider';

describe('UserCreateManyProvider', () => {
  let provider: UserCreateManyProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserCreateManyProvider,
        {
          provide: DataSource,
          useValue: {},
        },
        {
          provide: HashingProvider,
          useValue: { hashPassword: jest.fn() },
        },
      ],
    }).compile();

    provider = module.get<UserCreateManyProvider>(UserCreateManyProvider);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
