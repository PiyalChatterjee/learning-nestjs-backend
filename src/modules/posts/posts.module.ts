import { Module } from '@nestjs/common';
import { PostsController } from './posts.controller';
import { PostsService } from './provider/posts.service';
import { UsersModule } from '../users/users.module';
import { AuthService } from '../auth/provider/auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from './post.entity';
import { User } from '../users/user.entity';

/**
 * Posts feature module that exposes post endpoints and post service behavior.
 */
@Module({
  controllers: [PostsController],
  providers: [PostsService, AuthService],
  imports: [UsersModule, TypeOrmModule.forFeature([Post, User])],
})
export class PostsModule {}
