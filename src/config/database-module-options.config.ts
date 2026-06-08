import { ConfigService } from '@nestjs/config';
import { MongooseModuleAsyncOptions } from '@nestjs/mongoose';
import { TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';

/**
 * Shape of the namespaced `database` config returned by ConfigModule.
 */
interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  synchronize: boolean;
  autoLoadEntities: boolean;
}

/**
 * Async TypeORM module options resolved from configuration.
 */
export const postgresModuleOptions: TypeOrmModuleAsyncOptions = {
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const dbConfig = configService.get<DatabaseConfig>('database');

    return {
      type: 'postgres',
      host: dbConfig?.host ?? 'localhost',
      port: dbConfig?.port ?? 5432,
      username: dbConfig?.username ?? 'postgres',
      password: dbConfig?.password ?? 'admin123',
      database: dbConfig?.database ?? 'pip_learning_db',
      // Keep true while migrations are not yet in use.
      synchronize: dbConfig?.synchronize ?? true,
      autoLoadEntities: dbConfig?.autoLoadEntities ?? true,
      // Keep the HTTP server bootable even when DB is unavailable.
      // DB errors are handled in service methods at request time.
      manualInitialization: true,
    };
  },
};

/**
 * Async MongoDB module options resolved from configuration.
 */
export const mongoModuleOptions: MongooseModuleAsyncOptions = {
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => ({
    uri: configService.get<string>('mongoDb.uri'),
    dbName: 'nestjs-blog',
  }),
};
