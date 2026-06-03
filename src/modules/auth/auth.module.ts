import { forwardRef, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './provider/auth.service';
import { UsersModule } from '../users/users.module';
import { HashingProvider } from './provider/hashing.provider';
import { BcryptProvider } from './provider/bcrypt.provider';
import { SignInProvider } from './provider/sign-in.provider';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

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
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => {
        const appConfig = configService.get('appConfig');
        return {
          secret: appConfig.jwt.secret,
          signOptions: appConfig.jwt.signOptions,
        };
      },
      inject: [ConfigService],
    }),
  ],
  exports: [AuthService, HashingProvider],
})
export class AuthModule {}
