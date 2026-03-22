import { InputType, Field } from '@nestjs/graphql';
import { IsString, MinLength, MaxLength, Matches, IsOptional } from 'class-validator';

/**
 * Update Tag Input DTO
 *
 * Input type for updating an existing tag.
 * All fields are optional to support partial updates.
 *
 * Requirements:
 * - 8.2: Validate name is 1-50 characters and unique
 * - 8.3: Validate slug is unique, lowercase, and alphanumeric with hyphens
 * - 8.4: Validate description is maximum 500 characters
 */
@InputType()
export class UpdateTagInput {
  @Field(() => String, {
    nullable: true,
    description: 'Tag name (1-50 characters)',
  })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Name must be at least 1 character' })
  @MaxLength(50, { message: 'Name cannot exceed 50 characters' })
  name?: string;

  @Field(() => String, {
    nullable: true,
    description: 'Tag slug (lowercase, alphanumeric with hyphens)',
  })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Slug must be at least 1 character' })
  @MaxLength(50, { message: 'Slug cannot exceed 50 characters' })
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must be lowercase, alphanumeric with hyphens only',
  })
  slug?: string;

  @Field(() => String, {
    nullable: true,
    description: 'Tag description (max 500 characters)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Description cannot exceed 500 characters' })
  description?: string;
}
