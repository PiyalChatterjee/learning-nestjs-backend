import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { PatchUserDto } from '../dtos/patch-user.dto';
import { AuthService } from '../../auth/provider/auth.service';

@Injectable()
export class UsersService {
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
    console.log(`Fetching users with limit ${limit} and page ${page}`);
    return [
      {
        id: 1,
        name: 'John Doe',
        email: 'john.doe@example.com',
      },
    ];
  }
  public getUserById(id: number) {
    const isAuthenticated = this.authService.isAuthenticated('SAMPLE_TOKEN');
    if (!isAuthenticated) {
      throw new Error('Unauthorized');
    }
    return {
      id: id,
      name: 'John Doe',
      email: 'john.doe@example.com',
    };
  }
  public createUser(createUserDto: CreateUserDto) {
    const { firstName, lastName, email, password } = createUserDto;
    return {
      id: 2,
      name: `${firstName} ${lastName}`,
      email: email,
      password: password,
    };
  }
  public updateUser(id: number, updateUserDto: UpdateUserDto) {
    const { firstName, lastName, email } = updateUserDto;
    return {
      id: id,
      name: `${firstName} ${lastName}`,
      email: email,
    };
  }
  public patchUser(id: number, patchUserDto: PatchUserDto) {
    const partialPayload = Object.fromEntries(
      Object.entries(patchUserDto).filter(([, value]) => value !== undefined),
    );

    return {
      id: id,
      ...partialPayload,
    };
  }
  public deleteUser(id: number) {
    return {
      message: `User with id ${id} deleted successfully`,
    };
  }
}
