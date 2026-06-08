import { registerAs } from "@nestjs/config";

/**
 * MongoDB configuration provider.
 * Exports Mongoose connection settings from environment variables.
 * Registered as 'mongoDb' namespace in the configuration system.
 *
 * @returns {Object} MongoDB configuration object
 * @returns {string} uri - Full MongoDB connection string (e.g. `mongodb://localhost:27017/nestjs-blog`)
 *
 * @example
 * // Access via ConfigService
 * configService.get<string>('mongoDb.uri')
 */
export default registerAs('mongoDb', () => ({
  uri: process.env.MONGO_URI || 'mongodb://localhost:27017/pip_learning_db',
}));