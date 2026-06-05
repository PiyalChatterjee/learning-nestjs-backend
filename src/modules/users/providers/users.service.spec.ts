import { Test, TestingModule } from '@nestjs/testing';
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: AuthService,
          useValue: { isAuthenticated: jest.fn().mockReturnValue(true) },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {},
        },
        {
          provide: profileConfig.KEY,
          useValue: {},
        },
        {
          provide: UserCreateManyProvider,
          useValue: {},
        },
        {
          provide: PaginationProvider,
          useValue: {},
        },
        {
          provide: CreateUserProvider,
          useValue: {},
        },
        {
          provide: FindOneUserByEmailProvider,
          useValue: {},
        },
        {
          provide: FindOneByGoogleIdProvider,
          useValue: {},
        },
        {
          provide: CreateGoogleUserProvider,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
