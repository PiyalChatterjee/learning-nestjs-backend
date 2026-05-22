import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

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
}
