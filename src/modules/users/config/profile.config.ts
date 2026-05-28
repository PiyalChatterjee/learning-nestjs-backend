import { registerAs } from "@nestjs/config";

export default registerAs('profile', () => ({
  // Define profile-related configuration options here
  // For example:
  apiKey:
    process.env.PROFILE_API_KEY || 'default-api-key',
}));
