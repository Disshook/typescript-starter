import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Post } from './entities/post.entity';
import { PaginationInput } from '../../common/dto/pagination.input';
import { PostFiltersInput } from './dto/post-filters.input';
import { PostStatus } from './enums/post-status.enum';
import { resolvePagination, buildPageInfo } from '../../common/utils/pagination.util';

/**
 * Post Service
 *
 * Handles complex post business logic including:
 * - Batch loading for DataLoader
 * - Pagination with filtering and sorting
 * - Full-text search
 * - Post publishing with status updates
 *
 * Requirements: 5.8, 5.12, 21.6
 */
@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
  ) {}

  /**
   * Find posts by IDs for DataLoader batch loading
   *
   * Requirement 11.1: Batch multiple requests into single query
   * Requirement 11.2: Execute exactly one database query using IN clause
   * Requirement 11.3: Maintain same order as input IDs
   * Requirement 11.9: Return null for missing IDs
   *
   * @param ids - Array of post IDs
   * @returns Array of posts in same order as input IDs
   */
  async findByIds(ids: string[]): Promise<(Post | null)[]> {
    // Deduplicate IDs
    const uniqueIds = [...new Set(ids)];

    // Batch query using IN clause
    const posts = await this.postRepository.find({
      where: { id: In(uniqueIds) },
    });

    // Create a map for O(1) lookup
    const postMap = new Map<string, Post>();
    posts.forEach((post) => {
      postMap.set(post.id, post);
    });

    // Return results in the same order as input IDs
    // Return null for missing posts
    return ids.map((id) => postMap.get(id) || null);
  }

  /**
   * Find all posts with pagination, filtering, and sorting
   *
   * Requirement 5.12: Support pagination, filtering, and sorting
   * Requirement 12.4: Calculate offset from page and limit
   * Requirement 12.5: Return items for requested page
   * Requirement 12.6: Return pageInfo with metadata
   * Requirement 12.10: Support sorting
   *
   * @param pagination - Pagination parameters
   * @param filters - Optional filters for posts
   * @returns Paginated posts with metadata
   */
  async findAll(pagination: PaginationInput, filters?: PostFiltersInput) {
    const { page, limit, sortBy, sortOrder, offset } = resolvePagination(pagination);

    const queryBuilder = this.postRepository
      .createQueryBuilder('post')
      .skip(offset)
      .take(limit);

    if (filters?.status) {
      queryBuilder.andWhere('post.status = :status', { status: filters.status });
    }

    if (filters?.authorId) {
      queryBuilder.andWhere('post.authorId = :authorId', { authorId: filters.authorId });
    }

    queryBuilder.orderBy(`post.${sortBy}`, sortOrder);

    const [posts, total] = await queryBuilder.getManyAndCount();

    return {
      items: posts,
      pageInfo: buildPageInfo(page, limit, total),
    };
  }

  /**
   * Search posts with full-text search
   *
   * Requirement 21.6: Use FULLTEXT indexes on title and content columns
   * Requirement 5.12: Support searching posts
   *
   * @param searchText - Text to search for
   * @param pagination - Pagination parameters
   * @returns Paginated search results
   */
  async searchPosts(searchText: string, pagination: PaginationInput) {
    const { page, limit, sortBy, sortOrder, offset } = resolvePagination(pagination);

    const [posts, total] = await this.postRepository
      .createQueryBuilder('post')
      .where('post.title LIKE :searchText', { searchText: `%${searchText}%` })
      .orWhere('post.content LIKE :searchText', { searchText: `%${searchText}%` })
      .skip(offset)
      .take(limit)
      .orderBy(`post.${sortBy}`, sortOrder)
      .getManyAndCount();

    return {
      items: posts,
      pageInfo: buildPageInfo(page, limit, total),
    };
  }

  /**
   * Publish a post by updating status and setting publishedAt timestamp
   *
   * Requirement 5.8: Set publishedAt when status changes to PUBLISHED
   * Requirement 5.9: Update updatedAt timestamp
   *
   * @param id - Post ID
   * @returns Updated post
   */
  async publishPost(id: string): Promise<Post> {
    // Find the post
    const post = await this.postRepository.findOne({ where: { id } });

    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    // Update status and publishedAt
    post.status = PostStatus.PUBLISHED;
    post.publishedAt = new Date();

    // Save and return
    return this.postRepository.save(post);
  }
}
