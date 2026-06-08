import {
  ClassSerializerInterceptor,
  MiddlewareConsumer,
  Module,
  NestModule,
  ValidationPipe,
} from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
// Imported modules
import { UsersModule } from './modules/users/users.module';
import { PostsModule } from './modules/posts/posts.module';
import { AuthModule } from './modules/auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { TagsModule } from './modules/tags/tags.module';
import { MetaOptionsModule } from './modules/meta-options/meta-options.module';
import { PaginationModule } from './common/paginations/pagination.module';
// Database configuration
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import mongooseConfig from './config/mongoose.config';
import environmentValidationSchema from './config/environment.validation';
import { DatabaseConnectionBootstrap } from './database/database-connection.bootstrap';
import { AccessTokenGuard } from './modules/auth/guards/access-token.guard';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { jwtConfig } from './config/jwt.config';
import { JwtModule } from '@nestjs/jwt';
import { AuthenticationGuard } from './modules/auth/guards/authentication.guard';
import { DataResponseInterceptor } from './common/interceptors/data-response/data-response.interceptor';
import { HttpExceptionFilter } from './common/exceptions/filters/http-exception/http-exception.filter';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { UploadsModule } from './modules/uploads/uploads.module';
import { MailModule } from './modules/mail/mail.module';
import { MongooseModule } from '@nestjs/mongoose';
import {
  mongoModuleOptions,
  postgresModuleOptions,
} from './config/database-module-options.config';

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
      load: [databaseConfig, appConfig, mongooseConfig], // Load custom configuration providers
      validationSchema: environmentValidationSchema, // Add Joi validation schema here if needed
      validationOptions: {
        abortEarly: false, // Show all errors, not just first one
        allowUnknown: true, // Allows extra env vars (won't fail)
      },
    }),
    UsersModule,
    PostsModule,
    AuthModule,
    TagsModule,
    MetaOptionsModule,
    PaginationModule,
    JwtModule.registerAsync(jwtConfig),
    
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds
        limit: 100, // 100 requests per window
      },
    ]),
    TypeOrmModule.forRootAsync(postgresModuleOptions),
    MongooseModule.forRootAsync(mongoModuleOptions),
    UploadsModule,
    MailModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    DatabaseConnectionBootstrap,
    {
      provide: APP_GUARD,
      useClass: AuthenticationGuard, // Global guard that applies authentication to all routes by default.
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard, // Global rate limiting guard to restrict requests per client IP.
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ClassSerializerInterceptor, // Global interceptor to handle @Exclude and other class-transformer decorators for all responses.
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: DataResponseInterceptor, // Global interceptor to standardize API responses and exclude sensitive fields.
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter, // Global exception filter to handle HTTP exceptions and format error responses.
    },
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true, // Strip properties that do not have any decorators in the DTO
        transform: true, // Automatically transform payloads to DTO instances based on type hints
        forbidNonWhitelisted: true, // Throw an error if non-whitelisted properties are present
        validationError: { target: false }, // Do not include the original object in validation errors
      }), // Global validation pipe to validate and transform incoming request data based on DTOs and class-validator decorators.
    },
    AccessTokenGuard,
  ],
})
export class AppModule implements NestModule {
  /**
   * Registers global middleware for all incoming routes.
   *
   * `LoggerMiddleware` is applied to every route (`*`) and logs the HTTP
   * method and URL at the start of each request cycle, before guards and
   * interceptors run.
   *
   * @param consumer - NestJS middleware consumer used to bind middleware to routes.
   */
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
