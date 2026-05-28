import { registerAs } from '@nestjs/config';

/**
 * Database configuration provider.
 * Exports PostgreSQL connection settings and TypeORM options from environment variables.
 * Registered as 'database' namespace in the configuration system.
 *
 * @returns {Object} Database configuration object
 * @returns {string} host - Database server hostname or IP address
 * @returns {number} port - Database server port number
 * @returns {string} username - Database authentication username
 * @returns {string} password - Database authentication password
 * @returns {string} database - Database name/schema
 * @returns {boolean} synchronize - Auto-sync TypeORM entities to schema (development only)
 * @returns {boolean} autoLoadEntities - Automatically load entity files registered in modules
 */
export default registerAs('database', () => ({
  host: process.env.DB_HOST || 'localhost',
  port: +(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'admin123',
  database: process.env.DB_NAME || 'pip_learning_db',
  synchronize: (process.env.DB_SYNC || 'true') === 'true',
  autoLoadEntities: true,
}));
