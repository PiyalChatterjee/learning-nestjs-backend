import { Module } from '@nestjs/common';
import { TagsController } from './tags.controller';
import { Tag } from './tag.entity';
import { Post } from '../posts/post.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TagsService } from './providers/tags.service';

/**
 * Tags module managing blog post tags and their relationships.
 * Provides endpoints for creating, retrieving, and managing tags.
 * Integrates with posts module for many-to-many tag-post associations.
 */
@Module({
  controllers: [TagsController],
  imports: [TypeOrmModule.forFeature([Tag, Post])],
  providers: [TagsService],
})
export class TagsModule {}
