import { forwardRef, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './provider/auth.service';
import { UsersModule } from '../users/users.module';

/**
 * Authentication module providing auth services and controllers.
 * Handles JWT-based authentication, token validation, and cross-module auth interactions.
 * Uses ForwardRef to resolve circular dependency with UsersModule.
 */
@Module({
  controllers: [AuthController],
  providers: [AuthService],
  imports: [forwardRef(() => UsersModule)],
  exports: [AuthService],
})
export class AuthModule {}
