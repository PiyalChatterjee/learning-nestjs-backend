import { forwardRef, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './provider/auth.service';
import { UsersModule } from '../users/users.module';
import { HashingProvider } from './provider/hashing.provider';
import { BcryptProvider } from './provider/bcrypt.provider';
import { SignInProvider } from './provider/sign-in.provider';
import { JwtModule } from '@nestjs/jwt';
import { jwtConfig } from '../../config/jwt.config';

/**
 * Authentication module providing auth services and controllers.
 * Handles JWT-based authentication, token validation, and cross-module auth interactions.
 * Uses ForwardRef to resolve circular dependency with UsersModule.
 * JWT configuration is sourced from global appConfig.
 */
@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    {
      provide: HashingProvider,
      useClass: BcryptProvider,
    },
    SignInProvider,
  ],
  imports: [
    forwardRef(() => UsersModule),
    JwtModule.registerAsync(jwtConfig),
  ],
  exports: [AuthService, HashingProvider],
})
export class AuthModule {}
