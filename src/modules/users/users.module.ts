import { forwardRef, Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './provider/users.service';
import { AuthModule } from '../auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import profileConfig from './config/profile.config';
import { ConfigModule } from '@nestjs/config';
import { UserCreateManyProvider } from './provider/user-create-many.provider';
import { PaginationModule } from '../../common/paginations/pagination.module';
import { CreateUserProvider } from './provider/create-user.provider';
import { FindOneUserByEmailProvider } from './provider/find-one-user-by-email.provider';
import { JwtModule } from '@nestjs/jwt';
import { jwtConfig } from '../../config/jwt.config';

/**
 * Users feature module that provides user API endpoints and user service logic.
 */
@Module({
  controllers: [UsersController],
  providers: [
    UsersService,
    UserCreateManyProvider,
    CreateUserProvider,
    FindOneUserByEmailProvider,
  ],
  imports: [
    forwardRef(() => AuthModule),
    TypeOrmModule.forFeature([User]),
    ConfigModule.forFeature(profileConfig),
    PaginationModule,
    JwtModule.registerAsync(jwtConfig),
  ],
  exports: [UsersService, FindOneUserByEmailProvider],
})
export class UsersModule {}
