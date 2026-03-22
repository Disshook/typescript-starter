import { InputType, Field } from '@nestjs/graphql';
import {
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
  IsArray,
  IsUUID,
} from 'class-validator';

/**
 * Create Post Input DTO
 *
 * Input type for creating a new post.
 * Includes validation for title, content, slug format, and tags.
 *
 * Requirements:
 * - 5.6: Validate title is 1-255 characters
 * - 5.7: Validate content is minimum 10 characters and maximum 50000 characters
 * - 5.14: Validate slug is unique, lowercase, and alphanumeric with hyphens
 */
@InputType()
export class CreatePostInput {
  @Field(() => String, { description: 'Post title' })
  @IsString()
  @MinLength(1, { message: 'Title must be at least 1 character' })
  @MaxLength(255, { message: 'Title cannot exceed 255 characters' })
  title: string;

  @Field(() => String, { description: 'Post content' })
  @IsString()
  @MinLength(10, { message: 'Content must be at least 10 characters' })
  @MaxLength(50000, { message: 'Content cannot exceed 50000 characters' })
  content: string;

  @Field(() => String, { description: 'Post URL slug (lowercase, alphanumeric with hyphens)' })
  @IsString()
  @MinLength(1, { message: 'Slug must be at least 1 character' })
  @MaxLength(255, { message: 'Slug cannot exceed 255 characters' })
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must be lowercase, alphanumeric with hyphens only',
  })
  slug: string;

  @Field(() => [String], {
    nullable: true,
    description: 'Array of tag IDs to associate with the post',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true, message: 'Each tag ID must be a valid UUID' })
  tagIds?: string[];
}
