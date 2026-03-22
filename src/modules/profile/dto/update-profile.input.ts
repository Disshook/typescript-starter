import { InputType, Field } from '@nestjs/graphql';
import {
  IsString,
  MaxLength,
  IsOptional,
  IsUrl,
  IsDateString,
} from 'class-validator';

/**
 * Update Profile Input DTO
 *
 * Input type for updating an existing user profile.
 * All fields are optional to support partial updates.
 *
 * Requirements:
 * - 7.2: Validate bio is maximum 1000 characters
 * - 7.3: Validate avatarUrl is valid HTTPS URL format
 * - 7.4: Validate website is valid URL format
 * - 7.5: Validate birthDate user is at least 13 years old
 */
@InputType()
export class UpdateProfileInput {
  @Field(() => String, {
    nullable: true,
    description: 'User biography (max 1000 characters)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Bio cannot exceed 1000 characters' })
  bio?: string;

  @Field(() => String, {
    nullable: true,
    description: 'Avatar URL (must be HTTPS)',
  })
  @IsOptional()
  @IsUrl(
    { protocols: ['https'], require_protocol: true },
    { message: 'Avatar URL must be a valid HTTPS URL' },
  )
  avatarUrl?: string;

  @Field(() => String, {
    nullable: true,
    description: 'Personal website URL',
  })
  @IsOptional()
  @IsUrl({}, { message: 'Website must be a valid URL' })
  website?: string;

  @Field(() => String, {
    nullable: true,
    description: 'User location (max 100 characters)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Location cannot exceed 100 characters' })
  location?: string;

  @Field(() => String, {
    nullable: true,
    description: 'Birth date (ISO 8601 format: YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Birth date must be a valid date in ISO 8601 format' })
  birthDate?: string;
}
