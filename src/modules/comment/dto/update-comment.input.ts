import { InputType, Field } from '@nestjs/graphql';
import { IsString, MinLength, MaxLength } from 'class-validator';

/**
 * Update Comment Input DTO
 *
 * Input type for updating an existing comment.
 * Only the content field can be updated.
 * When updated, the isEdited flag will be set to true automatically.
 *
 * Requirements:
 * - 6.3: Validate content is 1-5000 characters
 */
@InputType()
export class UpdateCommentInput {
  @Field(() => String, { description: 'Updated comment content' })
  @IsString()
  @MinLength(1, { message: 'Content must be at least 1 character' })
  @MaxLength(5000, { message: 'Content cannot exceed 5000 characters' })
  content: string;
}
