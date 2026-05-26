import { Module } from '@nestjs/common';
import { TagsController } from './tags.controller';
import { Tag } from './tag.entity';
import { Post } from '../posts/post.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TagsService } from './providers/tags.service';

@Module({
  controllers: [TagsController],
  imports: [TypeOrmModule.forFeature([Tag, Post])],
  providers: [TagsService],
})
export class TagsModule {}
