import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as DataLoader from 'dataloader';
import { User } from '../../modules/user/entities/user.entity';
import { Post } from '../../modules/post/entities/post.entity';
import { Comment } from '../../modules/comment/entities/comment.entity';
import { Profile } from '../../modules/profile/entities/profile.entity';
import { DataLoaderRegistry } from '../interfaces/dataloader-registry.interface';

/**
 * DataLoader Factory Service
 *
 * Creates DataLoader instances for batching and caching database queries.
 * Each loader is scoped to a single GraphQL request to prevent N+1 query problems.
 *
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.8, 11.9
 */
@Injectable()
export class DataLoaderFactory {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
  ) {}

  /**
   * Create a complete DataLoader registry for a GraphQL request
   * Requirements: 11.4, 11.5
   */
  createLoaders(): DataLoaderRegistry {
    return {
      userLoader: this.createUserLoader(),
      postLoader: this.createPostLoader(),
      commentLoader: this.createCommentLoader(),
      postsByAuthorLoader: this.createPostsByAuthorLoader(),
      profileByUserIdLoader: this.createProfileByUserIdLoader(),
      commentsByPostLoader: this.createCommentsByPostLoader(),
    };
  }

  /**
   * Create User DataLoader
   *
   * Batches user queries by ID into a single database query.
   * Maintains input order and returns null for missing users.
   *
   * Requirements: 11.1, 11.2, 11.3, 11.8, 11.9
   */
  private createUserLoader(): DataLoader<string, User | null> {
    return new DataLoader<string, User | null>(
      async (ids: readonly string[]) => {
        // Deduplicate IDs (Requirement 11.8)
        const uniqueIds = [...new Set(ids)];

        // Batch query using IN clause (Requirement 11.2)
        const users = await this.userRepository.find({
          where: { id: In(uniqueIds) },
        });

        // Create a map for O(1) lookup
        const userMap = new Map<string, User>();
        users.forEach((user) => {
          userMap.set(user.id, user);
        });

        // Return results in the same order as input IDs (Requirement 11.3)
        // Return null for missing users (Requirement 11.9)
        return ids.map((id) => userMap.get(id) || null);
      },
    );
  }

  /**
   * Create Post DataLoader
   *
   * Batches post queries by ID into a single database query.
   * Maintains input order and returns null for missing posts.
   *
   * Requirements: 11.1, 11.2, 11.3, 11.8, 11.9
   */
  private createPostLoader(): DataLoader<string, Post | null> {
    return new DataLoader<string, Post | null>(
      async (ids: readonly string[]) => {
        // Deduplicate IDs (Requirement 11.8)
        const uniqueIds = [...new Set(ids)];

        // Batch query using IN clause (Requirement 11.2)
        const posts = await this.postRepository.find({
          where: { id: In(uniqueIds) },
        });

        // Create a map for O(1) lookup
        const postMap = new Map<string, Post>();
        posts.forEach((post) => {
          postMap.set(post.id, post);
        });

        // Return results in the same order as input IDs (Requirement 11.3)
        // Return null for missing posts (Requirement 11.9)
        return ids.map((id) => postMap.get(id) || null);
      },
    );
  }

  /**
   * Create Comment DataLoader
   *
   * Batches comment queries by ID into a single database query.
   * Maintains input order and returns null for missing comments.
   *
   * Requirements: 11.1, 11.2, 11.3, 11.8, 11.9
   */
  private createCommentLoader(): DataLoader<string, Comment | null> {
    return new DataLoader<string, Comment | null>(
      async (ids: readonly string[]) => {
        // Deduplicate IDs (Requirement 11.8)
        const uniqueIds = [...new Set(ids)];

        // Batch query using IN clause (Requirement 11.2)
        const comments = await this.commentRepository.find({
          where: { id: In(uniqueIds) },
        });

        // Create a map for O(1) lookup
        const commentMap = new Map<string, Comment>();
        comments.forEach((comment) => {
          commentMap.set(comment.id, comment);
        });

        // Return results in the same order as input IDs (Requirement 11.3)
        // Return null for missing comments (Requirement 11.9)
        return ids.map((id) => commentMap.get(id) || null);
      },
    );
  }

  /**
   * Create Posts by Author ID DataLoader
   *
   * Batches post queries by author ID into a single database query.
   * Returns array of posts for each author ID.
   *
   * Requirements: 11.1, 11.2, 11.3, 11.6
   */
  private createPostsByAuthorLoader(): DataLoader<string, Post[]> {
    return new DataLoader<string, Post[]>(
      async (authorIds: readonly string[]) => {
        // Deduplicate IDs
        const uniqueIds = [...new Set(authorIds)];

        // Batch query using IN clause
        const posts = await this.postRepository.find({
          where: { authorId: In(uniqueIds) },
        });

        // Group posts by authorId
        const postsByAuthor = new Map<string, Post[]>();
        posts.forEach((post) => {
          const existing = postsByAuthor.get(post.authorId) || [];
          existing.push(post);
          postsByAuthor.set(post.authorId, existing);
        });

        // Return results in the same order as input IDs
        // Return empty array for authors with no posts
        return authorIds.map((id) => postsByAuthor.get(id) || []);
      },
    );
  }

  /**
   * Create Profile by User ID DataLoader
   *
   * Batches profile queries by user ID into a single database query.
   * Maintains input order and returns null for missing profiles.
   *
   * Requirements: 11.1, 11.2, 11.3, 11.6, 11.9
   */
  private createProfileByUserIdLoader(): DataLoader<string, Profile | null> {
    return new DataLoader<string, Profile | null>(
      async (userIds: readonly string[]) => {
        // Deduplicate IDs
        const uniqueIds = [...new Set(userIds)];

        // Batch query using IN clause
        const profiles = await this.profileRepository.find({
          where: { userId: In(uniqueIds) },
        });

        // Create a map for O(1) lookup
        const profileMap = new Map<string, Profile>();
        profiles.forEach((profile) => {
          profileMap.set(profile.userId, profile);
        });

        // Return results in the same order as input IDs
        // Return null for missing profiles
        return userIds.map((id) => profileMap.get(id) || null);
      },
    );
  }

  /**
   * Create Comments by Post ID DataLoader
   *
   * Batches comment queries by post ID into a single database query.
   * Returns array of comments for each post ID.
   *
   * Requirements: 11.1, 11.2, 11.3, 11.7
   */
  private createCommentsByPostLoader(): DataLoader<string, Comment[]> {
    return new DataLoader<string, Comment[]>(
      async (postIds: readonly string[]) => {
        // Deduplicate IDs
        const uniqueIds = [...new Set(postIds)];

        // Batch query using IN clause
        const comments = await this.commentRepository.find({
          where: { postId: In(uniqueIds) },
        });

        // Group comments by postId
        const commentsByPost = new Map<string, Comment[]>();
        comments.forEach((comment) => {
          const existing = commentsByPost.get(comment.postId) || [];
          existing.push(comment);
          commentsByPost.set(comment.postId, existing);
        });

        // Return results in the same order as input IDs
        // Return empty array for posts with no comments
        return postIds.map((id) => commentsByPost.get(id) || []);
      },
    );
  }
}
