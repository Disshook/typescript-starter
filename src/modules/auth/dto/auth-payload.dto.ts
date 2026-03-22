import { ObjectType, Field, Int } from '@nestjs/graphql';
import { User } from '../../user/entities/user.entity';

/**
 * Authentication Payload Output Type
 *
 * Returned after successful authentication operations (login, register, refresh).
 * Contains JWT tokens and user information.
 *
 * Requirements:
 * - 2.3: Return access token, refresh token, and user information
 * - 2.5: Access token with 1-hour expiration
 * - 2.6: Refresh token with 7-day expiration
 */
@ObjectType()
export class AuthPayload {
  /**
   * JWT access token for API authentication
   * Short-lived (1 hour)
   */
  @Field()
  accessToken: string;

  /**
   * JWT refresh token for obtaining new access tokens
   * Long-lived (7 days)
   */
  @Field()
  refreshToken: string;

  /**
   * Authenticated user information
   */
  @Field(() => User)
  user: User;

  /**
   * Access token expiration time in seconds
   * Typically 3600 (1 hour)
   */
  @Field(() => Int)
  expiresIn: number;
}
