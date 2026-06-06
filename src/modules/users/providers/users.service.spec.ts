import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthService } from '../../auth/providers/auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../user.entity';
import profileConfig from '../config/profile.config';
import { UserCreateManyProvider } from './user-create-many.provider';
import { PaginationProvider } from '../../../common/paginations/provider/pagination.provider';
import { CreateUserProvider } from './create-user.provider';
import { FindOneUserByEmailProvider } from './find-one-user-by-email.provider';
import { FindOneByGoogleIdProvider } from './find-one-by-google-id.provider';
import { CreateGoogleUserProvider } from './create-google-user.provider';

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: { findOne: jest.Mock; save: jest.Mock; remove: jest.Mock };
  let authService: { isAuthenticated: jest.Mock };
  let paginationProvider: { paginateQuery: jest.Mock };
  let createUserProvider: { createUser: jest.Mock };
  let userCreateManyProvider: { createManyUsers: jest.Mock };
  let findOneUserByEmailProvider: { findOneByEmail: jest.Mock };
  let findOneByGoogleIdProvider: { findOneByGoogleId: jest.Mock };
  let createGoogleUserProvider: { createGoogleUser: jest.Mock };

  const mockUser: User = {
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    password: 'hashedPassword',
    googleId: undefined,
    posts: [],
  };

  const makePaginatedResult = (data: unknown[]) => ({
    data,
    meta: { totalItems: data.length, itemsPerPage: 10, totalPages: 1, currentPage: 1 },
    links: { first: '', previous: null, next: null, last: '', current: '' },
  });

  beforeEach(async () => {
    userRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };
    authService = { isAuthenticated: jest.fn().mockReturnValue(true) };
    paginationProvider = { paginateQuery: jest.fn() };
    createUserProvider = { createUser: jest.fn() };
    userCreateManyProvider = { createManyUsers: jest.fn() };
    findOneUserByEmailProvider = { findOneByEmail: jest.fn() };
    findOneByGoogleIdProvider = { findOneByGoogleId: jest.fn() };
    createGoogleUserProvider = { createGoogleUser: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: AuthService, useValue: authService },
        { provide: getRepositoryToken(User), useValue: userRepository },
        { provide: profileConfig.KEY, useValue: {} },
        { provide: UserCreateManyProvider, useValue: userCreateManyProvider },
        { provide: PaginationProvider, useValue: paginationProvider },
        { provide: CreateUserProvider, useValue: createUserProvider },
        { provide: FindOneUserByEmailProvider, useValue: findOneUserByEmailProvider },
        { provide: FindOneByGoogleIdProvider, useValue: findOneByGoogleIdProvider },
        { provide: CreateGoogleUserProvider, useValue: createGoogleUserProvider },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createUser', () => {
    it('should delegate to createUserProvider', async () => {
      createUserProvider.createUser.mockResolvedValue(mockUser);
      const result = await service.createUser({ firstName: 'John', lastName: 'Doe', email: 'john@example.com', password: 'Pass123!' });
      expect(result).toEqual(mockUser);
      expect(createUserProvider.createUser).toHaveBeenCalled();
    });
  });

  describe('createManyUsers', () => {
    it('should delegate to userCreateManyProvider', async () => {
      userCreateManyProvider.createManyUsers.mockResolvedValue([mockUser]);
      const result = await service.createManyUsers({ users: [] });
      expect(result).toEqual([mockUser]);
    });
  });

  describe('getAllUsers', () => {
    it('should return paginated users', async () => {
      paginationProvider.paginateQuery.mockResolvedValue(makePaginatedResult([mockUser]));
      const result = await service.getAllUsers({ page: 1, limit: 10 });
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toHaveProperty('name', 'John Doe');
    });

    it('should apply search filter', async () => {
      paginationProvider.paginateQuery.mockResolvedValue(makePaginatedResult([mockUser]));
      const result = await service.getAllUsers({ search: 'John' });
      expect(paginationProvider.paginateQuery).toHaveBeenCalled();
      expect(result.data[0].name).toBe('John Doe');
    });

    it('should apply sort order', async () => {
      paginationProvider.paginateQuery.mockResolvedValue(makePaginatedResult([mockUser]));
      await service.getAllUsers({ sortBy: 'firstName', sortOrder: 'asc' as any });
      expect(paginationProvider.paginateQuery).toHaveBeenCalled();
    });

    it('should use default sort when sortBy is not allowed', async () => {
      paginationProvider.paginateQuery.mockResolvedValue(makePaginatedResult([mockUser]));
      await service.getAllUsers({ sortBy: 'notAField' as any });
      expect(paginationProvider.paginateQuery).toHaveBeenCalled();
    });

    it('should handle user with null lastName', async () => {
      const userNoLastName = { ...mockUser, lastName: null };
      paginationProvider.paginateQuery.mockResolvedValue(makePaginatedResult([userNoLastName]));
      const result = await service.getAllUsers({});
      expect(result.data[0].name).toBe('John');
    });
  });

  describe('getUserById', () => {
    it('should return a user summary', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      const result = await service.getUserById(1);
      expect(result).toEqual({ id: 1, name: 'John Doe', email: 'john@example.com' });
    });

    it('should throw NotFoundException when user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);
      await expect(service.getUserById(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateUser', () => {
    it('should update and return user summary', async () => {
      userRepository.findOne.mockResolvedValueOnce(mockUser).mockResolvedValueOnce(null);
      userRepository.save.mockResolvedValue({ ...mockUser, firstName: 'Jane', email: 'jane@example.com' });
      const result = await service.updateUser(1, { firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com' });
      expect(result.email).toBe('jane@example.com');
    });

    it('should throw ConflictException if email already in use', async () => {
      userRepository.findOne
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce({ id: 2, email: 'taken@example.com' });
      await expect(service.updateUser(1, { firstName: 'Jane', lastName: 'Doe', email: 'taken@example.com' }))
        .rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException when user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);
      await expect(service.updateUser(999, { firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com' }))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('patchUser', () => {
    it('should patch and return user summary', async () => {
      userRepository.findOne.mockResolvedValueOnce(mockUser).mockResolvedValueOnce(null);
      userRepository.save.mockResolvedValue({ ...mockUser, firstName: 'Updated' });
      const result = await service.patchUser(1, { firstName: 'Updated' });
      expect(result.name).toContain('Updated');
    });

    it('should throw NotFoundException when user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);
      await expect(service.patchUser(999, { firstName: 'X' })).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if patched email already in use', async () => {
      userRepository.findOne
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce({ id: 2, email: 'taken@example.com' });
      await expect(service.patchUser(1, { email: 'taken@example.com' })).rejects.toThrow(ConflictException);
    });

    it('should skip email check if email is unchanged', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      userRepository.save.mockResolvedValue(mockUser);
      const result = await service.patchUser(1, { email: mockUser.email });
      expect(result).toBeDefined();
    });
  });

  describe('deleteUser', () => {
    it('should delete and return result message', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      userRepository.remove.mockResolvedValue(mockUser);
      const result = await service.deleteUser(1);
      expect(result).toEqual({ message: 'User with id 1 deleted successfully' });
    });

    it('should throw NotFoundException when user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);
      await expect(service.deleteUser(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOneByEmail', () => {
    it('should delegate to findOneUserByEmailProvider', async () => {
      findOneUserByEmailProvider.findOneByEmail.mockResolvedValue(mockUser);
      const result = await service.findOneByEmail('john@example.com');
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      findOneUserByEmailProvider.findOneByEmail.mockResolvedValue(null);
      const result = await service.findOneByEmail('nobody@example.com');
      expect(result).toBeNull();
    });
  });

  describe('findOneById', () => {
    it('should return user by id', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      const result = await service.findOneById(1);
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);
      const result = await service.findOneById(999);
      expect(result).toBeNull();
    });
  });

  describe('findOneByGoogleId', () => {
    it('should delegate to findOneByGoogleIdProvider', async () => {
      findOneByGoogleIdProvider.findOneByGoogleId.mockResolvedValue(mockUser);
      const result = await service.findOneByGoogleId('gid-123');
      expect(result).toEqual(mockUser);
    });
  });

  describe('createGoogleUser', () => {
    it('should delegate to createGoogleUserProvider', async () => {
      createGoogleUserProvider.createGoogleUser.mockResolvedValue(mockUser);
      const result = await service.createGoogleUser({ googleId: 'gid', email: 'g@example.com', firstName: 'G', lastName: null });
      expect(result).toEqual(mockUser);
    });
  });

  describe('linkGoogleAccount', () => {
    it('should link google account to user', async () => {
      userRepository.findOne
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(null);
      userRepository.save.mockResolvedValue({ ...mockUser, googleId: 'gid-99' });
      const result = await service.linkGoogleAccount(1, 'gid-99');
      expect(result.googleId).toBe('gid-99');
    });

    it('should throw NotFoundException when user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);
      await expect(service.linkGoogleAccount(999, 'gid')).rejects.toThrow(NotFoundException);
    });
  });
});
