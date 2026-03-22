import { InputType, Field } from '@nestjs/graphql';
import {
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
  IsEnum,
  IsArray,
  IsUUID,
} from 'class-validator';
import { PostStatus } from '../enums/post-status.enum';

/**
 * Update Post Input DTO
 *
 * Input type for updating an existing post.
 * All fields are optional to support partial updates.
 *
 * Requirements:
 * - 5.6: Validate title is 1-255 characters
 * - 5.7: Validate content is minimum 10 characters and maximum 50000 characters
 * - 5.14: Validate slug is unique, lowercase, and alphanumeric with hyphens
 */
@InputType()
export class UpdatePostInput {
  @Field(() => String, { nullable: true, description: 'Post title' })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Title must be at least 1 character' })
  @MaxLength(255, { message: 'Title cannot exceed 255 characters' })
  title?: string;

  @Field(() => String, { nullable: true, description: 'Post content' })
  @IsOptional()
  @IsString()
  @MinLength(10, { message: 'Content must be at least 10 characters' })
  @MaxLength(50000, { message: 'Content cannot exceed 50000 characters' })
  content?: string;

  @Field(() => String, {
    nullable: true,
    description: 'Post URL slug (lowercase, alphanumeric with hyphens)',
  })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Slug must be at least 1 character' })
  @MaxLength(255, { message: 'Slug cannot exceed 255 characters' })
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must be lowercase, alphanumeric with hyphens only',
  })
  slug?: string;

  @Field(() => PostStatus, { nullable: true, description: 'Post status' })
  @IsOptional()
  @IsEnum(PostStatus, { message: 'Status must be DRAFT, PUBLISHED, or ARCHIVED' })
  status?: PostStatus;

  @Field(() => [String], {
    nullable: true,
    description: 'Array of tag IDs to associate with the post',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true, message: 'Each tag ID must be a valid UUID' })
  tagIds?: string[];
}
