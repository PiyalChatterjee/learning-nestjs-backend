import { Module } from '@nestjs/common';
import { PostsController } from './posts.controller';
import { PostsService } from './providers/posts.service';
import { PostCreateManyProvider } from './providers/post-create-many.provider';
import { UsersModule } from '../users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from './post.entity';
import { User } from '../users/user.entity';
import { Tag } from '../tags/tag.entity';
import { MetaOption } from '../meta-options/meta-option.entity';
import { TagRelationValidator } from '../../common/validators/tag-relation.validator';
import { PaginationModule } from '../../common/paginations/pagination.module';
import { CreatePostProvider } from './providers/create-post.provider';
import { MongooseModule } from '@nestjs/mongoose';
import { Post as PostMongo, PostSchema } from './post.schema';

/**
 * Posts feature module that exposes post endpoints and post service behavior.
 */
@Module({
  controllers: [PostsController],
  providers: [
    PostsService,
    PostCreateManyProvider,
    TagRelationValidator,
    CreatePostProvider,
  ],
  imports: [
    UsersModule,
    PaginationModule,
    TypeOrmModule.forFeature([Post, User, Tag, MetaOption]),
    MongooseModule.forFeature([
      {
        name: PostMongo.name,
        schema: PostSchema,
      },
    ]),
  ],
})
export class PostsModule {}
