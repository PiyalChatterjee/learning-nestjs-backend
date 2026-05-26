import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Post } from '../posts/post.entity';

/**
 * Persistence model for reusable post tags.
 */
@Entity()
export class Tag {
  /** * Primary key for the tag record. */
  @PrimaryGeneratedColumn()
  id: number;

  /** * Human-readable name of the tag. */
  @Column({
    type: 'varchar',
    length: 256,
    nullable: false,
    unique: true,
  })
  name: string;

  /** * URL-friendly unique slug. */
  @Column({
    type: 'varchar',
    length: 256,
    nullable: false,
    unique: true,
  })
  slug: string;

  /** * Optional description of the tag. */
  @Column({
    type: 'text',
    nullable: true,
  })
  description: string | null;

  /** * Optional schema for additional tag metadata. */
  @Column({
    type: 'text',
    nullable: true,
  })
  schema: string | null;

  /** * Optional URL for the feature image of the tag. */
  @Column({
    type: 'varchar',
    length: 256,
    nullable: true,
  })
  featureImageUrl: string | null;

  /** * Date when the tag was created. */
  @CreateDateColumn()
  createDate: Date;

  /** * Date when the tag was last updated. */
  @UpdateDateColumn()
  updateDate: Date;

  /** * Date when the tag was deleted. */
  @DeleteDateColumn()
  deleteDate: Date | null;

  @ManyToMany(() => Post, (post) => post.tags)
  posts: Post[];
}
