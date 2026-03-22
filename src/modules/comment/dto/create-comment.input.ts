import { InputType, Field } from '@nestjs/graphql';
import {
  IsString,
  MinLength,
  MaxLength,
  IsUUID,
  IsOptional,
} from 'class-validator';

/**
 * Create Comment Input DTO
 *
 * Input type for creating a new comment.
 * Supports both top-level comments and nested replies.
 *
 * Requirements:
 * - 6.3: Validate content is 1-5000 characters
 * - 6.4: Validate postId references an existing post
 * - 6.5: Validate parentId references an existing comment (for replies)
 */
@InputType()
export class CreateCommentInput {
  @Field(() => String, { description: 'Comment content' })
  @IsString()
  @MinLength(1, { message: 'Content must be at least 1 character' })
  @MaxLength(5000, { message: 'Content cannot exceed 5000 characters' })
  content: string;

  @Field(() => String, { description: 'ID of the post being commented on' })
  @IsUUID('4', { message: 'Post ID must be a valid UUID' })
  postId: string;

  @Field(() => String, {
    nullable: true,
    description: 'ID of the parent comment (for nested replies)',
  })
  @IsOptional()
  @IsUUID('4', { message: 'Parent ID must be a valid UUID' })
  parentId?: string;
}
