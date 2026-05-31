import { Module } from '@nestjs/common';
import { PostsController } from './posts.controller';
import { PostsService } from './provider/posts.service';
import { PostCreateManyProvider } from './provider/post-create-many.provider';
import { UsersModule } from '../users/users.module';
import { AuthService } from '../auth/provider/auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from './post.entity';
import { User } from '../users/user.entity';
import { Tag } from '../tags/tag.entity';
import { MetaOption } from '../meta-options/meta-option.entity';
import { TagRelationValidator } from '../../common/validators/tag-relation.validator';
import { PaginationModule } from '../../common/paginations/pagination.module';

/**
 * Posts feature module that exposes post endpoints and post service behavior.
 */
@Module({
  controllers: [PostsController],
  providers: [
    PostsService,
    PostCreateManyProvider,
    AuthService,
    TagRelationValidator,
  ],
  imports: [
    UsersModule,
    PaginationModule,
    TypeOrmModule.forFeature([Post, User, Tag, MetaOption]),
  ],
})
export class PostsModule {}
