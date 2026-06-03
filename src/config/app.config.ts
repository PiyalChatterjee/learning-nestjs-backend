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
  jwt: {
    secret: process.env.JWT_SECRET,
    signOptions: {
      expiresIn: parseInt(process.env.JWT_ACCESS_TOKEN_TTL || '3600', 10),
      audience: process.env.JWT_TOKEN_AUDIENCE || 'localhost:8080',
      issuer: process.env.JWT_TOKEN_ISSUER || 'localhost:8080',
    },
  },
}));
