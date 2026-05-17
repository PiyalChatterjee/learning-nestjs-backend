import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { UsersService } from '../../users/provider/users.service';

@Injectable()
export class AuthService {
  /**
   * Inject the UsersService into the AuthService using dependency injection. This allows us to use the methods defined in the UsersService to handle user-related logic in our authentication service, such as validating user credentials against stored user data.
   */
  constructor(
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
  ) {}
  public login(email: string, password: string, id: number): any {
    const user = this.usersService.getUserById(id);
    // Implement your user validation logic here, such as checking the username and password against a database.
    return 'SAMPLE_TOKEN';
  }

  public isAuthenticated(token: string): boolean {
    // Implement your token validation logic here, such as verifying the token's signature and expiration.
    return true;
  }
}
