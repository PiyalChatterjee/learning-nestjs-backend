import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { GoogleAuthenticationService } from './providers/google-authentication.service';
import { GoogleTokenDto } from './dtos/google-token.dto';
import { Auth } from '../decorators/auth.decorator';
import { AuthType } from '../enums/auth-type.enum';

@Controller('auth/google-authentication')
export class GoogleAuthenticationController {
  constructor(
    private readonly googleAuthenticationService: GoogleAuthenticationService,
  ) {}

  @Auth(AuthType.None)
  @Post()
  @HttpCode(HttpStatus.OK)
  public async authenticate(@Body() googleTokenDto: GoogleTokenDto) {
    // This method will be implemented to handle the authentication flow.
    // It will receive the Google token from the client, call the service to authenticate,
    // and return the appropriate response (e.g., JWT tokens).

    return this.googleAuthenticationService.authenticate(googleTokenDto);
  }
}
