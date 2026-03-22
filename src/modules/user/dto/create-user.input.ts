import { InputType, Field } from '@nestjs/graphql';
import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
  IsArray,
} from 'class-validator';

/**
 * Create User Input DTO
 *
 * Input type for creating a new user.
 * Includes validation for email format, password complexity, and name length.
 *
 * Requirements:
 * - 4.5: Validate firstName and lastName are 1-100 characters
 * - 4.6: Validate email is valid format
 * - 9.5: Validate email field matches valid email format
 * - 9.6: Validate password is minimum 8 characters with uppercase, lowercase, and number
 * - 9.7: Validate field values don't exceed maximum length constraints
 */
@InputType()
export class CreateUserInput {
  @Field(() => String, { description: 'User email address' })
  @IsEmail({}, { message: 'Email must be a valid email address' })
  @MaxLength(255, { message: 'Email cannot exceed 255 characters' })
  email: string;

  @Field(() => String, { description: 'User password' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  password: string;

  @Field(() => String, { description: 'User first name' })
  @IsString()
  @MinLength(1, { message: 'First name must be at least 1 character' })
  @MaxLength(100, { message: 'First name cannot exceed 100 characters' })
  firstName: string;

  @Field(() => String, { description: 'User last name' })
  @IsString()
  @MinLength(1, { message: 'Last name must be at least 1 character' })
  @MaxLength(100, { message: 'Last name cannot exceed 100 characters' })
  lastName: string;

  @Field(() => [String], {
    nullable: true,
    description: 'User roles (defaults to ["user"])',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roles?: string[];
}
