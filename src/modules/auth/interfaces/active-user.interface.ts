/**
 * Minimal user claims carried in the access token and attached to authenticated requests.
 */
export interface IActiveUser {
  /** Subject claim: user id. */
  sub: number;
  /** Authenticated user's email address. */
  email: string;
}
