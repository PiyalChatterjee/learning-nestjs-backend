import { registerAs } from '@nestjs/config';

/**
 * Profile configuration provider for user-related settings and external API integrations.
 * Exports profile-specific configuration and third-party service credentials.
 * Registered as 'profile' namespace in the configuration system.
 *
 * @returns {Object} Profile configuration object
 * @returns {string} apiKey - API key for external profile/user management service
 */
export default registerAs('profile', () => ({
  // Define profile-related configuration options here
  // For example:
  apiKey: process.env.PROFILE_API_KEY || 'default-api-key',
}));
