import { InputType, Field, PartialType } from '@nestjs/graphql';
import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsBoolean,
  IsArray,
} from 'class-validator';

/**
 * Update User Input DTO
 *
 * Input type for updating an existing user.
 * All fields are optional to support partial updates.
 *
 * Requirements:
 * - 4.5: Validate firstName and lastName are 1-100 characters
 * - 4.6: Validate email is valid format
 * - 9.5: Validate email field matches valid email format
 * - 9.7: Validate field values don't exceed maximum length constraints
 */
@InputType()
export class UpdateUserInput {
  @Field(() => String, { nullable: true, description: 'User email address' })
  @IsOptional()
  @IsEmail({}, { message: 'Email must be a valid email address' })
  @MaxLength(255, { message: 'Email cannot exceed 255 characters' })
  email?: string;

  @Field(() => String, { nullable: true, description: 'User first name' })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'First name must be at least 1 character' })
  @MaxLength(100, { message: 'First name cannot exceed 100 characters' })
  firstName?: string;

  @Field(() => String, { nullable: true, description: 'User last name' })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Last name must be at least 1 character' })
  @MaxLength(100, { message: 'Last name cannot exceed 100 characters' })
  lastName?: string;

  @Field(() => [String], { nullable: true, description: 'User roles' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roles?: string[];

  @Field(() => Boolean, { nullable: true, description: 'User active status' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
