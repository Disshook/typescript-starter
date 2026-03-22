import { ObjectType, Field, Int } from '@nestjs/graphql';

/**
 * Page Info DTO
 *
 * Contains pagination metadata for paginated responses.
 *
 * Requirements:
 * - 4.8: Return page metadata including totalItems, totalPages, hasNextPage, hasPreviousPage
 * - 12.6: Return pageInfo with currentPage, pageSize, totalItems, totalPages, hasNextPage, hasPreviousPage
 */
@ObjectType()
export class PageInfo {
  @Field(() => Int, { description: 'Current page number (1-based)' })
  currentPage: number;

  @Field(() => Int, { description: 'Number of items per page' })
  pageSize: number;

  @Field(() => Int, { description: 'Total number of items across all pages' })
  totalItems: number;

  @Field(() => Int, { description: 'Total number of pages' })
  totalPages: number;

  @Field(() => Boolean, { description: 'Whether there is a next page' })
  hasNextPage: boolean;

  @Field(() => Boolean, { description: 'Whether there is a previous page' })
  hasPreviousPage: boolean;
}
