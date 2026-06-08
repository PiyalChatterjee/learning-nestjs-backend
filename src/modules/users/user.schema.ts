import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Exclude } from 'class-transformer';

/**
 * Mongoose schema class representing a User document in MongoDB.
 *
 * Used alongside the PostgreSQL `User` entity for polyglot persistence.
 * This schema targets the `nestjs-blog` MongoDB database and is intended
 * for document-oriented user data storage scenarios.
 *
 * @extends Document - Extends the Mongoose Document base class, providing
 * access to built-in Mongoose methods such as `save()`, `toObject()`, etc.
 */
@Schema({
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  collection: 'users',
})
export class User extends Document {
  /**
   * Optional link to the SQL row id when syncing data across Postgres and MongoDB.
   */
  @Prop({ type: Number, unique: true, sparse: true })
  sqlId?: number;

  /**
   * The user's first name.
   * Required. Maximum length of 96 characters.
   */
  @Prop({ type: String, required: true, maxlength: 96, trim: true })
  firstName: string;

  /**
   * The user's last name.
   * Optional. Maximum length of 96 characters.
   */
  @Prop({ type: String, maxlength: 96, trim: true })
  lastName?: string;

  /**
   * The user's email address.
   * Must be unique and in valid email format. Maximum length of 255 characters.
   */
  @Prop({
    type: String,
    unique: true,
    required: true,
    maxlength: 255,
    lowercase: true,
    trim: true,
  })
  email: string;

  /**
   * The user's hashed password.
   * Required. Maximum length of 255 characters.
   * Should never be stored or returned as plaintext.
   */
  @Exclude()
  @Prop({ type: String, required: false, maxlength: 255, select: false })
  password?: string;

  /**
   * The user's Google ID for OAuth authentication.
   * Optional. Maximum length of 255 characters.
   * Should never be returned in API responses to protect user privacy.
   */
  @Exclude()
  @Prop({ type: String, required: false, maxlength: 255, select: false })
  googleId?: string;

  /**
   * Array of post document ids authored by the user.
   * Uses MongoDB references instead of SQL-style entity relations.
   */
  @Prop({ type: [{ type: Types.ObjectId, ref: 'Post' }], default: [] })
  posts: Types.ObjectId[];

  /**
   * Timestamp when the user document was created.
   */
  createdAt: Date;

  /**
   * Timestamp when the user document was last updated.
   */
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
