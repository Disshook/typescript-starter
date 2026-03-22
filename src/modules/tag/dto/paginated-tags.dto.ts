import { ObjectType, Field } from '@nestjs/graphql';
import { Tag } from '../entities/tag.entity';
import { PageInfo } from '../../../common/dto/page-info.dto';

/**
 * Paginated Tags DTO
 *
 * Response type for paginated tag queries.
 *
 * Requirements:
 * - 8.7: Return paginated tags with metadata
 * - 12.6: Return pageInfo with pagination metadata
 */
@ObjectType()
export class PaginatedTags {
  @Field(() => [Tag], { description: 'Array of tags for current page' })
  items: Tag[];

  @Field(() => PageInfo, { description: 'Pagination metadata' })
  pageInfo: PageInfo;
}
