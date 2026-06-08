import * as Joi from 'joi';

/**
 * Environment variable validation schema.
 * Defines expected structure, types, and default values for all environment variables.
 * Used by NestJS ConfigModule to validate and transform env configuration at startup.
 *
 * @type {Joi.ObjectSchema}
 */
export default Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  DB_HOST: Joi.string().default('localhost'),
  DB_PORT: Joi.number().default(5432),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_NAME: Joi.string().required(),
  DB_SYNC: Joi.boolean().default(true),
  JWT_SECRET: Joi.string().required(),
  JWT_TOKEN_AUDIENCE: Joi.string().required(),
  JWT_TOKEN_ISSUER: Joi.string().required(),
  JWT_ACCESS_TOKEN_TTL: Joi.number().default(3600),
  JWT_REFRESH_TOKEN_TTL: Joi.number().default(86400),
  GOOGLE_CLIENT_ID: Joi.string().required(),
  GOOGLE_CLIENT_SECRET: Joi.string().required(),
  API_VERSION: Joi.string().default('0.1.1'),
  AZURE_STORAGE_CONNECTION_STRING: Joi.string().required(),
  AZURE_BLOB_CONTAINER_NAME: Joi.string().default('uploads'),
  AZURE_CDN_ENDPOINT: Joi.string().uri().required(),
  MAIL_HOST: Joi.string().required(),
  SMTP_USERNAME: Joi.string().required(),
  SMTP_PASSWORD: Joi.string().required(),
  SMTP_PORT: Joi.number().default(587),
  MONGO_URI: Joi.string().uri().required(),
});
