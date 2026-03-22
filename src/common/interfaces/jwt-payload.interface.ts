/**
 * JWT Token Payload Interface
 *
 * Defines the structure of data encoded in JWT tokens.
 * This payload is included in both access and refresh tokens.
 *
 * Fields:
 * - sub: Subject (user ID) - standard JWT claim
 * - email: User's email address
 * - roles: Array of user roles for authorization
 * - iat: Issued at timestamp (automatically added by JWT library)
 * - exp: Expiration timestamp (automatically added by JWT library)
 */
export interface JWTPayload {
  /**
   * Subject - User ID (UUID)
   */
  sub: string;

  /**
   * User's email address
   */
  email: string;

  /**
   * User's roles for authorization
   */
  roles: string[];

  /**
   * Issued at timestamp (Unix timestamp in seconds)
   */
  iat?: number;

  /**
   * Expiration timestamp (Unix timestamp in seconds)
   */
  exp?: number;
}
