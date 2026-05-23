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
// Database configuration
import { AppDataSource } from './database/data-source';

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
@Module({
  imports: [
    // Loads environment variables from .env and exposes them application-wide.
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    UsersModule,
    PostsModule,
    AuthModule,
    TagsModule,
    MetaOptionsModule,
    // Asynchronously configures TypeORM using environment variables.
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      // Builds TypeORM options from environment variables.
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: parseInt(configService.get<string>('DB_PORT', '5432'), 10),
        username: configService.get<string>('DB_USERNAME', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', 'admin123'),
        database: configService.get<string>('DB_NAME', 'pip_learning_db'),
        synchronize: configService.get<string>('DB_SYNC', 'true') === 'true',
        autoLoadEntities: true,
      }),
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
