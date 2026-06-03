import { FindOneUserByEmailProvider } from './find-one-user-by-email.provider';
import { Repository } from 'typeorm';
import { User } from '../user.entity';

describe('FindOneUserByEmailProvider', () => {
  let provider: FindOneUserByEmailProvider;
  let userRepository: Partial<Repository<User>>;

  beforeEach(() => {
    userRepository = {
      findOne: jest.fn(),
    };
    provider = new FindOneUserByEmailProvider(
      userRepository as Repository<User>,
    );
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
