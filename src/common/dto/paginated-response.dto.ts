import { Type } from '@nestjs/common';
import { Field, ObjectType } from '@nestjs/graphql';
import { PageInfo } from './page-info.dto';

/**
 * Paginated Response Factory
 *
 * Creates a generic paginated response type for any entity.
 * This factory function allows creating type-safe paginated responses
 * for different entity types.
 *
 * Usage:
 * ```typescript
 * @ObjectType()
 * export class PaginatedUsers extends PaginatedResponse(User) {}
 * ```
 *
 * Requirements:
 * - 12.5: Return items for the requested page
 * - 12.6: Return pageInfo with pagination metadata
 */
export function PaginatedResponse<T>(classRef: Type<T>): any {
  @ObjectType({ isAbstract: true })
  abstract class PaginatedType {
    @Field(() => [classRef], { description: 'List of items for current page' })
    items: T[];

    @Field(() => PageInfo, { description: 'Pagination metadata' })
    pageInfo: PageInfo;
  }

  return PaginatedType;
}
