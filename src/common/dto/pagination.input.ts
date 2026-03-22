import { InputType, Field, Int } from '@nestjs/graphql';
import { IsOptional, IsInt, Min, Max, IsIn } from 'class-validator';

/**
 * Pagination Input DTO
 *
 * Provides pagination parameters for list queries.
 * Supports page-based pagination with sorting.
 *
 * Requirements:
 * - 12.1: Accept page and limit parameters
 * - 12.2: Validate page is >= 1
 * - 12.3: Validate limit is > 0 and <= 100
 * - 12.10: Support sortBy and sortOrder parameters
 */
@InputType()
export class PaginationInput {
  @Field(() => Int, { defaultValue: 1, description: 'Page number (1-based)' })
  @IsOptional()
  @IsInt()
  @Min(1, { message: 'Page must be at least 1' })
  page: number = 1;

  @Field(() => Int, {
    defaultValue: 10,
    description: 'Number of items per page (max 100)',
  })
  @IsOptional()
  @IsInt()
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit cannot exceed 100' })
  limit: number = 10;

  @Field(() => String, {
    nullable: true,
    description: 'Field to sort by',
  })
  @IsOptional()
  sortBy?: string;

  @Field(() => String, {
    nullable: true,
    defaultValue: 'ASC',
    description: 'Sort order (ASC or DESC)',
  })
  @IsOptional()
  @IsIn(['ASC', 'DESC'], { message: 'Sort order must be ASC or DESC' })
  sortOrder?: 'ASC' | 'DESC' = 'ASC';
}
