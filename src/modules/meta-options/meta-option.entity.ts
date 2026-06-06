import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Post } from '../posts/post.entity';

/**
 * Persistence model for post metadata options.
 */
@Entity()
export class MetaOption {
  /** * Primary key for the meta option record. */
  @PrimaryGeneratedColumn()
  id: number;

  /** * JSON object for the meta option. */
  @Column({
    type: 'json',
    nullable: false,
  })
  metaValue: string;

  /** * Date when the meta option was created. */
  @CreateDateColumn()
  createDate: Date;

  /** * Date when the meta option was last updated. */
  @UpdateDateColumn()
  updateDate: Date;

  /**
   * Reference to the associated Post entity.
   * One-to-one relationship with cascade delete.
   */
  @OneToOne(() => Post, (post) => post.metaValue, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: Post;
}
