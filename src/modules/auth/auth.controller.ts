import { Controller } from '@nestjs/common';
import { AuthService } from './provider/auth.service';

/**
 * Exposes authentication-related HTTP endpoints.
 */
@Controller('auth')
export class AuthController {
  /**
   * Inject the AuthService into the AuthController using dependency injection. This allows us to use the methods defined in the AuthService to handle authentication-related logic in our controller.
   */
  constructor(private readonly authService: AuthService) {}
}
