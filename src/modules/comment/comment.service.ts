import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Comment } from './entities/comment.entity';

/**
 * Comment Service
 *
 * Handles complex comment business logic including:
 * - Batch loading for DataLoader
 * - Fetching comments by post with nested replies
 * - Circular reference prevention for nested replies
 *
 * Requirements: 6.6, 6.10, 6.13
 */
@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
  ) {}

  /**
   * Find comments by IDs for DataLoader batch loading
   *
   * Requirement 11.1: Batch multiple requests into single query
   * Requirement 11.2: Execute exactly one database query using IN clause
   * Requirement 11.3: Maintain same order as input IDs
   * Requirement 11.9: Return null for missing IDs
   *
   * @param ids - Array of comment IDs
   * @returns Array of comments in same order as input IDs
   */
  async findByIds(ids: string[]): Promise<(Comment | null)[]> {
    const uniqueIds = [...new Set(ids)];

    const comments = await this.commentRepository.find({
      where: { id: In(uniqueIds) },
    });

    const commentMap = new Map<string, Comment>();
    comments.forEach((comment) => {
      commentMap.set(comment.id, comment);
    });

    return ids.map((id) => commentMap.get(id) || null);
  }

  /**
   * Find top-level comments for a post with their nested replies
   *
   * Returns only root-level comments (parentId IS NULL).
   * Replies are loaded as a nested structure via recursive loading.
   *
   * Requirement 6.6: Support nested replies
   * Requirement 6.10: Return comments with nested reply structure
   *
   * @param postId - Post ID to fetch comments for
   * @returns Array of top-level comments with nested replies
   */
  async findByPostId(postId: string): Promise<Comment[]> {
    // Fetch all comments for the post in one query
    const allComments = await this.commentRepository.find({
      where: { postId },
      order: { createdAt: 'ASC' },
    });

    // Build a map for O(1) lookup
    const commentMap = new Map<string, Comment & { replies: Comment[] }>();
    allComments.forEach((comment) => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    // Build the tree structure
    const rootComments: Comment[] = [];
    commentMap.forEach((comment) => {
      if (comment.parentId) {
        const parent = commentMap.get(comment.parentId);
        if (parent) {
          parent.replies.push(comment);
        }
      } else {
        rootComments.push(comment);
      }
    });

    return rootComments;
  }

  /**
   * Validate that setting parentId would not create a circular reference
   *
   * Walks up the ancestor chain from the proposed parent to ensure
   * the comment being created/moved is not already an ancestor.
   *
   * Requirement 6.13: Prevent circular references in nested replies
   *
   * @param commentId - The comment that would become a child (null for new comments)
   * @param parentId - The proposed parent comment ID
   * @throws BadRequestException if a circular reference would be created
   */
  async validateNoCircularReference(
    commentId: string | null,
    parentId: string,
  ): Promise<void> {
    // Walk up the ancestor chain from parentId
    let currentId: string | null = parentId;
    const visited = new Set<string>();

    while (currentId) {
      // Detect cycle in the existing tree
      if (visited.has(currentId)) {
        throw new BadRequestException(
          'Circular reference detected in comment tree',
        );
      }

      // If the proposed parent is the comment itself, that's a self-reference
      if (commentId && currentId === commentId) {
        throw new BadRequestException(
          'A comment cannot be a reply to itself or its own descendant',
        );
      }

      visited.add(currentId);

      const ancestor = await this.commentRepository.findOne({
        where: { id: currentId },
        select: ['id', 'parentId'],
      });

      if (!ancestor) break;

      currentId = ancestor.parentId || null;
    }
  }

  /**
   * Verify that a parent comment belongs to the same post
   *
   * Requirement 6.5: parentId must reference a comment on the same post
   *
   * @param parentId - Parent comment ID
   * @param postId - Post ID the new comment belongs to
   * @throws NotFoundException if parent comment not found
   * @throws BadRequestException if parent comment is on a different post
   */
  async validateParentComment(parentId: string, postId: string): Promise<void> {
    const parent = await this.commentRepository.findOne({
      where: { id: parentId },
      select: ['id', 'postId'],
    });

    if (!parent) {
      throw new NotFoundException(
        `Parent comment with ID ${parentId} not found`,
      );
    }

    if (parent.postId !== postId) {
      throw new BadRequestException(
        'Parent comment must belong to the same post',
      );
    }
  }
}
