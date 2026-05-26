import { Check, Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Post } from '../posts/post.entity';

/**
 * User persistence model mapped to the users table.
 */
@Entity()
@Check(
  'CHK_user_email_format',
  `"email" ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'`,
)
@Check(
  'CHK_user_password_strength',
  `length("password") BETWEEN 8 AND 64 AND "password" ~ '[A-Z]' AND "password" ~ '[a-z]' AND "password" ~ '[0-9]' AND "password" ~ '[^A-Za-z0-9]'`,
)
export class User {
  /**
   * Primary key for the user record.
   */
  @PrimaryGeneratedColumn({
    type: 'integer',
    name: 'id',
  })
  id: number;

  /**
   * User first name.
   */
  @Column({
    type: 'varchar',
    length: 96,
    name: 'first_name',
  })
  firstName: string;

  /**
   * Optional user last name.
   */
  @Column({
    type: 'varchar',
    length: 96,
    name: 'last_name',
    nullable: true,
  })
  lastName: string | null;

  /**
   * Unique email address used for account identity.
   */
  @Column({
    type: 'varchar',
    length: 255,
    unique: true,
    name: 'email',
  })
  email: string;

  /**
   * Password hash or password value used during learning flow.
   */
  @Column({
    type: 'varchar',
    length: 64,
    name: 'password',
  })
  password: string;

  @OneToMany(() => Post, (post) => post.author)
  posts: Post[];
}
