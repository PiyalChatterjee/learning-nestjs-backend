import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { PostStatus } from './enums/post-status.enum';
import { PostType } from './enums/post-type.enum';
import { User } from '../users/user.entity';
@Entity()
export class Post {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'varchar',
    length: 512,
    nullable: false,
  })
  title: string;

  @Column({
    type: 'enum',
    enum: PostType,
    nullable: false,
  })
  postType: PostType;

  @Column({
    type: 'varchar',
    length: 256,
    nullable: false,
    unique: true,
  })
  slug: string;

  @Column({
    type: 'enum',
    enum: PostStatus,
    nullable: false,
    default: PostStatus.DRAFT,
  })
  status: PostStatus;

  @Column({
    type: 'text',
    nullable: true,
  })
  content: string | null;

  @Column({
    type: 'text',
    nullable: true,
  })
  schema: string | null;

  @Column({
    type: 'varchar',
    length: 1024,
    nullable: true,
    name: 'featured_image_url',
  })
  featuredImageUrl: string | null;

  @Column({
    type: 'timestamptz',
    nullable: true,
    name: 'publish_on',
  })
  publishOn: Date | null;

  @Column({
    type: 'varchar',
    array: true,
    nullable: true,
  })
  tags: string[];

  @Column({
    type: 'jsonb',
    nullable: true,
    name: 'meta_options',
  })
  metaOptions: Record<string, string>[];

  @ManyToOne(() => User, { nullable: false, eager: false })
  @JoinColumn({ name: 'author_id' })
  author: User;
}
