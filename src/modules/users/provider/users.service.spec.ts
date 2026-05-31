import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { AuthService } from '../../auth/provider/auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../user.entity';
import profileConfig from '../config/profile.config';
import { UserCreateManyProvider } from './user-create-many.provider';
import { PaginationProvider } from '../../../common/paginations/provider/pagination.provider';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: AuthService,
          useValue: {},
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
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
