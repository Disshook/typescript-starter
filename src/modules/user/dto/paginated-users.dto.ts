import { ObjectType, Field } from '@nestjs/graphql';
import { User } from '../entities/user.entity';
import { PageInfo } from '../../../common/dto/page-info.dto';

/**
 * Paginated Users Response DTO
 *
 * Response type for paginated user queries.
 * Contains array of users and pagination metadata.
 *
 * Requirements:
 * - 4.8: Return results with page metadata
 * - 12.6: Return pageInfo with metadata
 */
@ObjectType()
export class PaginatedUsers {
  @Field(() => [User], { description: 'Array of users for current page' })
  items: User[];

  @Field(() => PageInfo, { description: 'Pagination metadata' })
  pageInfo: PageInfo;
}
