import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { PatchUserDto } from '../dtos/patch-user.dto';
import { AuthService } from '../../auth/provider/auth.service';
import { assertResourceExists } from '../../../common/exceptions/not-found.helper';

type UserRecord = {
  id: number;
  firstName: string;
  lastName?: string;
  email: string;
};

@Injectable()
export class UsersService {
  private readonly users: UserRecord[] = [
    {
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
    },
  ];

  /**
   * Inject the AuthService into the UsersService using dependency injection. This allows us to use the methods defined in the AuthService to handle authentication-related logic in our user service, such as validating user credentials or checking if a user is authenticated before allowing access to certain user-related operations.
   */
  constructor(
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
  ) {}
  public getAllUsers(limit: number, page: number) {
    const isAuthenticated = this.authService.isAuthenticated('SAMPLE_TOKEN');
    if (!isAuthenticated) {
      throw new Error('Unauthorized');
    }
    const offset = (page - 1) * limit;
    return this.users.slice(offset, offset + limit).map((user) => ({
      id: user.id,
      name: `${user.firstName} ${user.lastName ?? ''}`.trim(),
      email: user.email,
    }));
  }

  public getUserById(id: number) {
    const isAuthenticated = this.authService.isAuthenticated('SAMPLE_TOKEN');
    if (!isAuthenticated) {
      throw new Error('Unauthorized');
    }

    const user = assertResourceExists(
      this.users.find((entry) => entry.id === id),
      'User',
      id,
    );

    return {
      id: user.id,
      name: `${user.firstName} ${user.lastName ?? ''}`.trim(),
      email: user.email,
    };
  }

  public createUser(createUserDto: CreateUserDto) {
    const { firstName, lastName, email, password } = createUserDto;
    const user = {
      id: this.users.length + 1,
      firstName,
      lastName,
      email,
    };

    this.users.push(user);

    return {
      id: user.id,
      name: `${firstName} ${lastName ?? ''}`.trim(),
      email,
      password,
    };
  }

  public updateUser(id: number, updateUserDto: UpdateUserDto) {
    const userIndex = this.users.findIndex((user) => user.id === id);
    const existingUser = assertResourceExists(this.users[userIndex], 'User', id);
    const { firstName, lastName, email } = updateUserDto;
    this.users[userIndex] = {
      ...existingUser,
      firstName,
      lastName,
      email,
    };

    return {
      id,
      name: `${firstName} ${lastName}`,
      email,
    };
  }

  public patchUser(id: number, patchUserDto: PatchUserDto) {
    const userIndex = this.users.findIndex((user) => user.id === id);
    const existingUser = assertResourceExists(this.users[userIndex], 'User', id);
    const partialPayload = Object.fromEntries(
      Object.entries(patchUserDto).filter(([, value]) => value !== undefined),
    );

    this.users[userIndex] = {
      ...existingUser,
      ...partialPayload,
    };

    const patchedUser = this.users[userIndex];

    return {
      id: patchedUser.id,
      name: `${patchedUser.firstName} ${patchedUser.lastName ?? ''}`.trim(),
      email: patchedUser.email,
    };
  }

  public deleteUser(id: number) {
    const userIndex = this.users.findIndex((user) => user.id === id);
    assertResourceExists(this.users[userIndex], 'User', id);
    this.users.splice(userIndex, 1);

    return {
      message: `User with id ${id} deleted successfully`,
    };
  }
}
