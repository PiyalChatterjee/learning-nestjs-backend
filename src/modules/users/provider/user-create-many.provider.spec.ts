import { Test, TestingModule } from '@nestjs/testing';
import { UserCreateManyProvider } from './user-create-many.provider';
import { DataSource } from 'typeorm';

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
      ],
    }).compile();

    provider = module.get<UserCreateManyProvider>(UserCreateManyProvider);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
