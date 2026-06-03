/**
 * Supported authentication modes understood by AuthenticationGuard.
 */
export enum AuthType {
  /** Requires a valid JWT bearer token. */
  Bearer,
  /** Marks endpoint as public (no authentication required). */
  None,
}
