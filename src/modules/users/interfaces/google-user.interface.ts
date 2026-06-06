/**
 * Represents essential user information extracted from a Google ID token.
 * Used during Google OAuth authentication to create or link user accounts.
 */
export interface IGoogleUser {
  /** Unique Google user identifier (subject claim from ID token). */
  googleId: string;
  /** User's verified email address from Google account. */
  email: string;
  /** User's first name (given_name claim from ID token). */
  firstName: string;
  /** User's last name (family_name claim from ID token). */
  lastName: string;
}
