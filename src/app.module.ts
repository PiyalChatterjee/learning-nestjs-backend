import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
// Imported modules
import { UsersModule } from './modules/users/users.module';
import { PostsModule } from './modules/posts/posts.module';
import { AuthModule } from './modules/auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TagsModule } from './modules/tags/tags.module';
import { MetaOptionsModule } from './modules/meta-options/meta-options.module';
import { PaginationModule } from './common/paginations/pagination.module';
// Database configuration
import { AppDataSource } from './database/data-source';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import environmentValidationSchema from './config/environment.validation';
import { DatabaseConnectionBootstrap } from './database/database-connection.bootstrap';

/**
 * Root application module that wires feature modules and infrastructure.
 *
 * Database Configuration:
 * - Development: Uses TypeOrmModule.forRootAsync with autoLoadEntities: true and synchronize: true
 *   to auto-discover entities and apply schema changes on startup.
 * - Production: Should use AppDataSource from src/database/data-source.ts with explicit migrations
 *   (set synchronize: false and run migrations via `npm run migration:run`).
 *
 * See src/database/data-source.ts for the TypeORM CLI configuration used by migration commands.
 */

const ENV = process.env.NODE_ENV;
/** Path to the environment file loaded by ConfigModule, derived from NODE_ENV (e.g. `.env.development.local` or `.env`). */
const ENV_FILE_PATH = ENV ? `.env.${ENV}.local` : '.env';
@Module({
  imports: [
    // Loads environment variables from .env and exposes them application-wide.
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ENV_FILE_PATH,
      load: [databaseConfig, appConfig],
      validationSchema: environmentValidationSchema, // Add Joi validation schema here if needed
    }),
    UsersModule,
    PostsModule,
    AuthModule,
    TagsModule,
    MetaOptionsModule,
    PaginationModule,
    // Asynchronously configures TypeORM using environment variables.
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      // Builds TypeORM options from environment variables.
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('database.host', 'localhost'),
        port: +(configService.get<string>('database.port', '5432')),
        username: configService.get<string>('database.username', 'postgres'),
        password: configService.get<string>('database.password', 'admin123'),
        database: configService.get<string>('database.database', 'pip_learning_db'),
        synchronize: configService.get<string>('database.synchronize', 'true') === 'true',
        autoLoadEntities: true,
        // Keep the HTTP server bootable even when DB is unavailable.
        // DB errors are handled in service methods at request time.
        manualInitialization: true,
      }),
    }),
  ],
  controllers: [AppController],
  providers: [AppService, DatabaseConnectionBootstrap],
})
export class AppModule {}
