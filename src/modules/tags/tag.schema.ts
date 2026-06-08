import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/**
 * MongoDB document schema for blog post tags.
 *
 * Mirrors the SQL `Tag` entity while adapting the ManyToMany relationship
 * to a document model by storing references to post documents.
 */
@Schema({
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  collection: 'tags',
})
export class Tag extends Document {
  /**
   * Optional link to the SQL row id when syncing data across Postgres and MongoDB.
   */
  @Prop({ type: Number, unique: true, sparse: true })
  sqlId?: number;

  /**
   * Human-readable name of the tag.
   * Required. Must be unique. Maximum length of 256 characters.
   */
  @Prop({ type: String, required: true, unique: true, maxlength: 256, trim: true })
  name: string;

  /**
   * URL-friendly unique slug derived from the tag name.
   * Required. Must be unique. Maximum length of 256 characters.
   */
  @Prop({ type: String, required: true, unique: true, maxlength: 256, trim: true })
  slug: string;

  /**
   * Optional description of the tag.
   * Provides context about the tag's purpose or usage.
   */
  @Prop({ type: String, default: null })
  description?: string | null;

  /**
   * Optional schema metadata for additional tag-related structured data.
   */
  @Prop({ type: String, default: null })
  tagSchema?: string | null;

  /**
   * Optional URL for the featured image of the tag.
   * Maximum length of 256 characters.
   */
  @Prop({ type: String, maxlength: 256, default: null })
  featureImageUrl?: string | null;

  /**
   * Array of post document ids associated with this tag.
   * Uses MongoDB references instead of SQL-style junction tables.
   */
  @Prop({ type: [{ type: Types.ObjectId, ref: 'Post' }], default: [] })
  posts: Types.ObjectId[];

  /**
   * Timestamp when the tag document was created.
   */
  createdAt: Date;

  /**
   * Timestamp when the tag document was last updated.
   */
  updatedAt: Date;
}

export const TagSchema = SchemaFactory.createForClass(Tag);
