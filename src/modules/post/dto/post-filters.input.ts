import { InputType, Field } from '@nestjs/graphql';
import { IsOptional, IsEnum, IsString, IsUUID } from 'class-validator';
import { PostStatus } from '../enums/post-status.enum';

/**
 * Post Filters Input DTO
 *
 * Input type for filtering posts in queries.
 * Supports filtering by status, author, and search text.
 *
 * Requirements:
 * - 5.12: Support filtering posts
 */
@InputType()
export class PostFiltersInput {
  @Field(() => PostStatus, {
    nullable: true,
    description: 'Filter by post status',
  })
  @IsOptional()
  @IsEnum(PostStatus)
  status?: PostStatus;

  @Field(() => String, {
    nullable: true,
    description: 'Filter by author ID',
  })
  @IsOptional()
  @IsUUID('4')
  authorId?: string;

  @Field(() => String, {
    nullable: true,
    description: 'Search text for full-text search',
  })
  @IsOptional()
  @IsString()
  searchText?: string;
}
