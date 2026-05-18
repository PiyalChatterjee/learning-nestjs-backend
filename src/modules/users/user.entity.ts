import { Check, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

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
  @PrimaryGeneratedColumn({
    type: 'integer',
    name: 'id',
  })
  id: number;

  @Column({
    type: 'varchar',
    length: 96,
    name: 'first_name',
  })
  firstName: string;

  @Column({
    type: 'varchar',
    length: 96,
    name: 'last_name',
    nullable: true,
  })
  lastName: string | null;

  @Column({
    type: 'varchar',
    length: 255,
    unique: true,
    name: 'email',
  })
  email: string;

  @Column({
    type: 'varchar',
    length: 64,
    name: 'password',
  })
  password: string;
}
