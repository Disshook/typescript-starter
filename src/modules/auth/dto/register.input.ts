import { InputType, Field } from '@nestjs/graphql';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

/**
 * Register Input DTO
 *
 * Input for user registration mutation.
 * Validates all required fields and password complexity.
 *
 * Requirements:
 * - 2.1: Register with email, password, firstName, lastName
 * - 9.5: Validate email format
 * - 9.7: Validate password complexity (min 8 chars, uppercase, lowercase, number)
 * - 19.1-19.4: Password security requirements
 */
@InputType()
export class RegisterInput {
  /**
   * User's email address (must be unique)
   */
  @Field()
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  /**
   * User's password
   * Must be at least 8 characters with uppercase, lowercase, and number
   */
  @Field()
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  password: string;

  /**
   * User's first name
   */
  @Field()
  @IsString()
  @IsNotEmpty({ message: 'First name is required' })
  @MinLength(1, { message: 'First name must be at least 1 character' })
  @MaxLength(100, { message: 'First name must not exceed 100 characters' })
  firstName: string;

  /**
   * User's last name
   */
  @Field()
  @IsString()
  @IsNotEmpty({ message: 'Last name is required' })
  @MinLength(1, { message: 'Last name must be at least 1 character' })
  @MaxLength(100, { message: 'Last name must not exceed 100 characters' })
  lastName: string;
}
