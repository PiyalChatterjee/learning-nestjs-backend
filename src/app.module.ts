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

/**
 * Root application module that wires feature modules and infrastructure.
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
