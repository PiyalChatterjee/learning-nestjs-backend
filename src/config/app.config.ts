import { registerAs } from '@nestjs/config';

/**
 * Application configuration provider.
 * Exports environment-specific configuration settings for the NestJS application.
 * Registered as 'appConfig' namespace in the configuration system.
 *
 * @returns {Object} Application configuration object
 * @returns {string} environment - Current deployment environment (development, production, test)
 */
export default registerAs('appConfig', () => ({
  environment: process.env.NODE_ENV || 'development',
}));
