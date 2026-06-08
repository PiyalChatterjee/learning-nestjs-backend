import { DataSource } from 'typeorm';
import { User } from '../modules/users/user.entity';
import { Post } from '../modules/posts/post.entity';
import { Tag } from '../modules/tags/tag.entity';
import { MetaOption } from '../modules/meta-options/meta-option.entity';

/**
 * TypeORM DataSource configuration for CLI and migration operations.
 *
 * This is the single source of truth for database connection and entity registration.
 * Used by the TypeORM CLI for running migrations, generating migrations from entity changes,
 * and reverting migrations in production environments.
 *
 * In development, the AppModule uses TypeOrmModule.forRootAsync with autoLoadEntities: true
 * to automatically discover entities from feature modules.
 *
 * @template Entities List of all entities (User, Post, Tag, MetaOption)
 * @template Migrations Location where auto-generated migration files are stored
 * @template synchronize Set to false in production; rely on explicit migrations instead
 */
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'admin123',
  database: process.env.DB_NAME || 'pip_learning_db',
  entities: [User, Post, Tag, MetaOption],
  migrations: ['src/database/migrations/**/*.ts'],
  synchronize: false,
  logging: false,
  ssl: process.env.DB_HOST?.includes('neon') ? { rejectUnauthorized: false } : false,
});
