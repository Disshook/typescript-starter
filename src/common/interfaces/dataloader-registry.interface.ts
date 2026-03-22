import * as DataLoader from 'dataloader';
import { User } from '../../modules/user/entities/user.entity';
import { Post } from '../../modules/post/entities/post.entity';
import { Comment } from '../../modules/comment/entities/comment.entity';
import { Profile } from '../../modules/profile/entities/profile.entity';

/**
 * DataLoader Registry Interface
 *
 * Defines the structure of the DataLoader registry.
 * Each loader batches and caches database queries per request to prevent N+1 problems.
 *
 * Requirements: 11.4, 11.5
 */
export interface DataLoaderRegistry {
  /**
   * User DataLoader
   * Batches user queries by ID
   */
  userLoader: DataLoader<string, User | null>;

  /**
   * Post DataLoader
   * Batches post queries by ID
   */
  postLoader: DataLoader<string, Post | null>;

  /**
   * Comment DataLoader
   * Batches comment queries by ID
   */
  commentLoader: DataLoader<string, Comment | null>;

  /**
   * Posts by Author ID DataLoader
   * Batches post queries by author ID
   */
  postsByAuthorLoader: DataLoader<string, Post[]>;

  /**
   * Profile by User ID DataLoader
   * Batches profile queries by user ID
   */
  profileByUserIdLoader: DataLoader<string, Profile | null>;

  /**
   * Comments by Post ID DataLoader
   * Batches comment queries by post ID
   */
  commentsByPostLoader: DataLoader<string, Comment[]>;
}
