import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './provider/auth.service';
import { SignInDto } from './dtos/signin.dto';

/**
 * Exposes authentication-related HTTP endpoints.
 */
@Controller('auth')
export class AuthController {
  /**
   * Inject the AuthService into the AuthController using dependency injection. This allows us to use the methods defined in the AuthService to handle authentication-related logic in our controller.
   */
  constructor(private readonly authService: AuthService) {}

  @Post('sign-in')
  @HttpCode(HttpStatus.OK)
  public async signIn(@Body() signInDto: SignInDto) {
    // Implement sign-in logic here, such as validating user credentials and returning a JWT token.
    return await this.authService.signIn(signInDto);
  }
}
