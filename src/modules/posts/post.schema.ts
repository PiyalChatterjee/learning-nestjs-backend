import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { PostStatus } from './enums/post-status.enum';
import { PostType } from './enums/post-type.enum';

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
 * Optional metadata payload for a post document.
 */
class PostMetaValue {
  @Prop({ type: String, maxlength: 350 })
  metaTitle?: string;

  @Prop({ type: String, maxlength: 350 })
  metaDescription?: string;

  @Prop({ type: [String], default: [] })
  keyword?: string[];
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

  @Prop({ type: String, enum: PostType, required: true, default: PostType.POST })
  postType: PostType;

  @Prop({ type: String, required: true, unique: true, maxlength: 256, trim: true })
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

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: PostMetaValue, default: null })
  metaValue?: PostMetaValue | null;

  @Prop({ type: PostAuthor, required: true })
  author: PostAuthor;

  createdAt: Date;
  updatedAt: Date;
}

export const PostSchema = SchemaFactory.createForClass(Post);
