import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { UserCreateManyProvider } from './user-create-many.provider';
import { DataSource } from 'typeorm';
import { HashingProvider } from '../../auth/providers/hashing.provider';
import { User } from '../user.entity';

describe('UserCreateManyProvider', () => {
  let provider: UserCreateManyProvider;
  let queryRunner: any;
  let hashingProvider: { hashPassword: jest.Mock };

  beforeEach(async () => {
    queryRunner = {
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      manager: {
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
      },
    };
    hashingProvider = { hashPassword: jest.fn().mockResolvedValue('hashed') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserCreateManyProvider,
        { provide: DataSource, useValue: { createQueryRunner: jest.fn().mockReturnValue(queryRunner) } },
        { provide: HashingProvider, useValue: hashingProvider },
      ],
    }).compile();

    provider = module.get<UserCreateManyProvider>(UserCreateManyProvider);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  describe('createManyUsers', () => {
    it('should create multiple users successfully', async () => {
      const dto = {
        users: [
          { firstName: 'Alice', lastName: 'Smith', email: 'alice@example.com', password: 'Pass123!' },
          { firstName: 'Bob', lastName: 'Jones', email: 'bob@example.com', password: 'Pass123!' },
        ],
      };
      const mockUsers = dto.users.map((u, i) => ({ id: i + 1, ...u, password: 'hashed' } as unknown as User));
      queryRunner.manager.findOne.mockResolvedValue(null);
      queryRunner.manager.create.mockImplementation((_, data) => ({ ...data }));
      queryRunner.manager.save.mockResolvedValue(mockUsers);

      const result = await provider.createManyUsers(dto);
      expect(result).toEqual(mockUsers);
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });

    it('should throw BadRequestException when batch is empty', async () => {
      await expect(provider.createManyUsers({ users: [] })).rejects.toThrow(BadRequestException);
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should throw BadRequestException when batch exceeds 100 users', async () => {
      const dto = { users: Array(101).fill(null).map((_, i) => ({
        firstName: 'User', lastName: null, email: `u${i}@example.com`, password: 'Pass123!'
      })) };
      await expect(provider.createManyUsers(dto)).rejects.toThrow(BadRequestException);
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should throw BadRequestException for duplicate emails in batch', async () => {
      const dto = {
        users: [
          { firstName: 'A', lastName: null, email: 'dup@example.com', password: 'Pass123!' },
          { firstName: 'B', lastName: null, email: 'dup@example.com', password: 'Pass123!' },
        ],
      };
      await expect(provider.createManyUsers(dto)).rejects.toThrow(BadRequestException);
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should throw ConflictException when email already exists in DB', async () => {
      queryRunner.manager.findOne.mockResolvedValue({ id: 99, email: 'existing@example.com' });
      const dto = {
        users: [{ firstName: 'C', lastName: null, email: 'existing@example.com', password: 'Pass123!' }],
      };
      await expect(provider.createManyUsers(dto)).rejects.toThrow(ConflictException);
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should always release query runner on error', async () => {
      await expect(provider.createManyUsers({ users: [] })).rejects.toThrow();
      expect(queryRunner.release).toHaveBeenCalled();
    });
  });
});

