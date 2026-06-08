import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { PostStatus } from './enums/post-status.enum';
import { PostType } from './enums/post-type.enum';
import { User } from '../users/user.schema';
import { MetaOption } from '../meta-options/meta-option.schema';
import { Tag } from '../tags/tag.schema';

/**
 * Denormalized author payload for read-heavy post documents.
 */
class PostAuthor {
  @Prop({ type: Number })
  id?: number;

  @Prop({ type: String, required: true, maxlength: 255 })
  email: string;

  @Prop({ type: String, required: true, maxlength: 96 })
  firstName: string;

  @Prop({ type: String, maxlength: 96 })
  lastName?: string;
}

/**
 * Embedded MetaOption document matching the MetaOption entity.
 */
class PostMetaValue {
  @Prop({ type: Number })
  id?: number;

  @Prop({ type: String, required: true })
  metaValue: string;

  @Prop({ type: Date })
  createDate?: Date;

  @Prop({ type: Date })
  updateDate?: Date;
}

/**
 * Embedded Tag document for denormalized tag data in posts.
 */
class PostTag {
  @Prop({ type: Number })
  id?: number;

  @Prop({ type: String, required: true, maxlength: 256 })
  name: string;

  @Prop({ type: String, required: true, maxlength: 256 })
  slug: string;

  @Prop({ type: String, default: null })
  description?: string | null;

  @Prop({ type: String, default: null })
  tagSchema?: string | null;

  @Prop({ type: String, maxlength: 256, default: null })
  featureImageUrl?: string | null;
}

/**
 * MongoDB document schema for blog posts.
 *
 * This mirrors the SQL `Post` entity while adapting relationships to a
 * document model by embedding author, tags, and metadata directly.
 */
@Schema({
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  collection: 'posts',
})
export class Post extends Document {
  @Prop({ type: Number, unique: true, sparse: true })
  sqlId?: number;

  @Prop({ type: String, required: true, maxlength: 512, trim: true })
  title: string;

  @Prop({
    type: String,
    enum: PostType,
    required: true,
    default: PostType.POST,
  })
  postType: PostType;

  @Prop({
    type: String,
    required: true,
    unique: true,
    maxlength: 256,
    trim: true,
  })
  slug: string;

  @Prop({ type: String, enum: PostStatus, default: PostStatus.DRAFT })
  status: PostStatus;

  @Prop({ type: String, default: null })
  content?: string | null;

  @Prop({ type: String, default: null })
  postSchema?: string | null;

  @Prop({ type: String, maxlength: 1024, default: null })
  featuredImageUrl?: string | null;

  @Prop({ type: Date, default: null })
  publishOn?: Date | null;

  @Prop({ type: [Number], default: [] })
  tags: number[];

  @Prop({
    type: Number,
    default: null,
  })
  metaValue?: number | null;

  @Prop({
    type: Number,
    required: true,
  })
  author: number;

  createdAt: Date;
  updatedAt: Date;
}

export const PostSchema = SchemaFactory.createForClass(Post);
