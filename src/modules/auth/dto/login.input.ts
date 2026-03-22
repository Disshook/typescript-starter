import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

/**
 * Login Input DTO
 *
 * Input for user login mutation.
 * Validates email format and password presence.
 *
 * Requirements:
 * - 2.4: Login with valid credentials
 * - 9.5: Validate email format
 */
@InputType()
export class LoginInput {
  /**
   * User's email address
   */
  @Field()
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  /**
   * User's password
   */
  @Field()
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password: string;
}
