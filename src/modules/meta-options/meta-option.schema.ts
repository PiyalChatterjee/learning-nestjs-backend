import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/**
 * MongoDB document schema for post metadata options.
 *
 * Mirrors the SQL `MetaOption` entity while adapting the OneToOne relationship
 * to a document model by storing a reference to the associated post document.
 */
@Schema({
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  collection: 'meta_options',
})
export class MetaOption extends Document {
  /**
   * Optional link to the SQL row id when syncing data across Postgres and MongoDB.
   */
  @Prop({ type: Number, unique: true, sparse: true })
  sqlId?: number;

  /**
   * JSON object containing meta option key-value pairs.
   * Required. Stores metadata like meta title, description, keywords, etc.
   */
  @Prop({ type: Object, required: true })
  metaValue: Record<string, any>;

  /**
   * Reference to the associated post document.
   * Uses MongoDB reference instead of SQL foreign key.
   */
  @Prop({ type: Types.ObjectId, ref: 'Post', required: true })
  postId: Types.ObjectId;

  /**
   * Timestamp when the meta option document was created.
   */
  createdAt: Date;

  /**
   * Timestamp when the meta option document was last updated.
   */
  updatedAt: Date;
}

export const MetaOptionSchema = SchemaFactory.createForClass(MetaOption);
