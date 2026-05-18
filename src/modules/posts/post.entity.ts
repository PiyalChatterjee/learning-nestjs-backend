import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { PostStatus } from './enums/post-status.enum';
import { PostType } from './enums/post-type.enum';
import { User } from '../users/user.entity';

/**
 * Post persistence model mapped to the posts table.
 */
@Entity()
export class Post {
  /**
   * Primary key for the post record.
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * Human-readable title of the post.
   */
  @Column({
    type: 'varchar',
    length: 512,
    nullable: false,
  })
  title: string;

  /**
   * Classification of post content.
   */
  @Column({
    type: 'enum',
    enum: PostType,
    nullable: false,
  })
  postType: PostType;

  /**
   * URL-friendly unique slug.
   */
  @Column({
    type: 'varchar',
    length: 256,
    nullable: false,
    unique: true,
  })
  slug: string;

  /**
   * Publishing lifecycle status.
   */
  @Column({
    type: 'enum',
    enum: PostStatus,
    nullable: false,
    default: PostStatus.DRAFT,
  })
  status: PostStatus;

  /**
   * Optional full content body.
   */
  @Column({
    type: 'text',
    nullable: true,
  })
  content: string | null;

  /**
   * Optional schema label for structured content.
   */
  @Column({
    type: 'text',
    nullable: true,
  })
  schema: string | null;

  /**
   * Optional featured image URL.
   */
  @Column({
    type: 'varchar',
    length: 1024,
    nullable: true,
    name: 'featured_image_url',
  })
  featuredImageUrl: string | null;

  /**
   * Optional scheduled publication timestamp.
   */
  @Column({
    type: 'timestamptz',
    nullable: true,
    name: 'publish_on',
  })
  publishOn: Date | null;

  /**
   * Optional list of tag labels.
   */
  @Column({
    type: 'varchar',
    array: true,
    nullable: true,
  })
  tags: string[];

  /**
   * Optional metadata map persisted as JSON.
   */
  @Column({
    type: 'jsonb',
    nullable: true,
    name: 'meta_options',
  })
  metaOptions: Record<string, string>[];

  /**
   * User who authored the post.
   */
  @ManyToOne(() => User, { nullable: false, eager: false })
  @JoinColumn({ name: 'author_id' })
  author: User;
}
