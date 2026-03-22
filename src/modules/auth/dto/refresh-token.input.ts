import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * Refresh Token Input DTO
 *
 * Input for refreshing access tokens using a valid refresh token.
 *
 * Requirements:
 * - 2.12: Refresh token functionality
 */
@InputType()
export class RefreshTokenInput {
  /**
   * Valid JWT refresh token
   */
  @Field()
  @IsString()
  @IsNotEmpty({ message: 'Refresh token is required' })
  refreshToken: string;
}
