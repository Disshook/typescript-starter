import { ObjectType, Field } from '@nestjs/graphql';
import { Post } from '../entities/post.entity';
import { PageInfo } from '../../../common/dto/page-info.dto';

/**
 * Paginated Posts DTO
 *
 * Response type for paginated post queries.
 * Contains array of posts and pagination metadata.
 *
 * Requirements:
 * - 5.12: Return paginated posts with metadata
 * - 12.6: Return pageInfo with pagination metadata
 */
@ObjectType()
export class PaginatedPosts {
  @Field(() => [Post], { description: 'Array of posts for current page' })
  items: Post[];

  @Field(() => PageInfo, { description: 'Pagination metadata' })
  pageInfo: PageInfo;
}
