import {
  Resolver,
  Query,
  Mutation,
  Args,
  ID,
  ResolveField,
  Parent,
  Context,
} from '@nestjs/graphql';
import {
  UseGuards,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { CommentService } from './comment.service';
import { CreateCommentInput } from './dto/create-comment.input';
import { UpdateCommentInput } from './dto/update-comment.input';
import { GqlAuthGuard } from '../../common/guards/gql-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { GraphQLContext } from '../../common/interfaces/graphql-context.interface';
import { User } from '../user/entities/user.entity';
import { Post } from '../post/entities/post.entity';

/**
 * Comment Resolver
 *
 * Handles GraphQL queries and mutations for Comment entity.
 * Follows pragmatic resolver-service pattern:
 * - Simple CRUD with validation: Direct repository access + service validation
 * - Complex operations (nested tree): Delegate to service layer
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.7, 6.8, 6.11, 6.12
 */
@Resolver(() => Comment)
export class CommentResolver {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    private readonly commentService: CommentService,
  ) {}

  /**
   * Query comments for a post (top-level with nested replies)
   *
   * Complex operation: Uses service to build nested tree structure
   * Requirement 6.1: Return comments for a post
   * Requirement 6.6: Return nested replies structure
   *
   * @param postId - Post ID to fetch comments for
   * @returns Array of top-level comments with nested replies
   */
  @Query(() => [Comment], {
    name: 'comments',
    description: 'Get comments for a post with nested replies',
  })
  async getComments(
    @Args('postId', { type: () => ID }) postId: string,
  ): Promise<Comment[]> {
    // Verify post exists (Requirement 6.4)
    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException(`Post with ID ${postId} not found`);
    }

    return this.commentService.findByPostId(postId);
  }

  /**
   * Create a new comment or reply
   *
   * Simple operation with validation: Direct repository save + service validation
   * Requirement 6.2: Set authorId to authenticated user's ID
   * Requirement 6.3: Validate content length
   * Requirement 6.4: Validate postId references an existing post
   * Requirement 6.5: Validate parentId references a comment on the same post
   *
   * @param input - Comment creation data
   * @param currentUser - Authenticated user
   * @returns Created comment
   */
  @UseGuards(GqlAuthGuard)
  @Mutation(() => Comment, { description: 'Create a new comment or reply' })
  async createComment(
    @Args('input', { type: () => CreateCommentInput })
    input: CreateCommentInput,
    @CurrentUser() currentUser: User,
  ): Promise<Comment> {
    // Verify post exists (Requirement 6.4)
    const post = await this.postRepository.findOne({
      where: { id: input.postId },
    });
    if (!post) {
      throw new NotFoundException(`Post with ID ${input.postId} not found`);
    }

    // Validate parent comment if provided (Requirement 6.5)
    if (input.parentId) {
      await this.commentService.validateParentComment(
        input.parentId,
        input.postId,
      );
      await this.commentService.validateNoCircularReference(
        null,
        input.parentId,
      );
    }

    const comment = this.commentRepository.create({
      content: input.content,
      postId: input.postId,
      authorId: currentUser.id, // Requirement 6.2
      parentId: input.parentId || null,
      isEdited: false,
    });

    return this.commentRepository.save(comment);
  }

  /**
   * Update an existing comment
   *
   * Simple operation with auth: Direct repository update + isEdited flag
   * Requirement 6.7: Set isEdited to true when content is updated
   * Requirement 6.8: Verify user owns the comment or has admin role
   * Requirement 6.11: Return not found error if comment doesn't exist
   *
   * @param id - Comment ID
   * @param input - Comment update data
   * @param currentUser - Authenticated user
   * @returns Updated comment
   */
  @UseGuards(GqlAuthGuard)
  @Mutation(() => Comment, { description: 'Update an existing comment' })
  async updateComment(
    @Args('id', { type: () => ID }) id: string,
    @Args('input', { type: () => UpdateCommentInput })
    input: UpdateCommentInput,
    @CurrentUser() currentUser: User,
  ): Promise<Comment> {
    const comment = await this.commentRepository.findOne({ where: { id } });

    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }

    // Authorization check (Requirement 6.8)
    if (
      comment.authorId !== currentUser.id &&
      !currentUser.roles?.includes('admin')
    ) {
      throw new ForbiddenException(
        'You do not have permission to update this comment',
      );
    }

    // Update content and set isEdited flag (Requirement 6.7)
    await this.commentRepository.update(id, {
      content: input.content,
      isEdited: true,
    });

    return this.commentRepository.findOne({ where: { id } });
  }

  /**
   * Delete a comment
   *
   * Simple operation with auth: Direct repository delete
   * Requirement 6.12: Verify user owns the comment or has admin role
   * Requirement 6.9: Cascade delete reply comments
   *
   * @param id - Comment ID
   * @param currentUser - Authenticated user
   * @returns Success boolean
   */
  @UseGuards(GqlAuthGuard)
  @Mutation(() => Boolean, { description: 'Delete a comment' })
  async deleteComment(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() currentUser: User,
  ): Promise<boolean> {
    const comment = await this.commentRepository.findOne({ where: { id } });

    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }

    // Authorization check (Requirement 6.12)
    if (
      comment.authorId !== currentUser.id &&
      !currentUser.roles?.includes('admin')
    ) {
      throw new ForbiddenException(
        'You do not have permission to delete this comment',
      );
    }

    // Delete comment (cascade will handle reply comments per Requirement 6.9)
    const result = await this.commentRepository.delete(id);
    return result.affected > 0;
  }

  /**
   * Field resolver for comment author
   *
   * Uses DataLoader for batch loading to prevent N+1 queries
   * Requirement 11.7: Batch all author requests into one query
   *
   * @param comment - Parent comment entity
   * @param context - GraphQL context with DataLoaders
   * @returns Comment author
   */
  @ResolveField(() => User, { name: 'author' })
  async getAuthor(
    @Parent() comment: Comment,
    @Context() context: GraphQLContext,
  ): Promise<User> {
    return context.loaders.userLoader.load(comment.authorId);
  }

  /**
   * Field resolver for comment's post
   *
   * Uses DataLoader for batch loading to prevent N+1 queries
   * Requirement 11.7: Batch all post requests into one query
   *
   * @param comment - Parent comment entity
   * @param context - GraphQL context with DataLoaders
   * @returns Post the comment belongs to
   */
  @ResolveField(() => Post, { name: 'post' })
  async getPost(
    @Parent() comment: Comment,
    @Context() context: GraphQLContext,
  ): Promise<Post> {
    return context.loaders.postLoader.load(comment.postId);
  }

  /**
   * Field resolver for comment's parent
   *
   * Uses DataLoader for batch loading to prevent N+1 queries
   * Returns null for top-level comments
   * Requirement 11.7: Batch all parent comment requests into one query
   *
   * @param comment - Parent comment entity
   * @param context - GraphQL context with DataLoaders
   * @returns Parent comment or null
   */
  @ResolveField(() => Comment, { name: 'parent', nullable: true })
  async getParent(
    @Parent() comment: Comment,
    @Context() context: GraphQLContext,
  ): Promise<Comment | null> {
    if (!comment.parentId) return null;
    return context.loaders.commentLoader.load(comment.parentId);
  }

  /**
   * Field resolver for comment replies
   *
   * Loads direct replies for a comment from the repository.
   * Requirement 6.6: Support nested replies
   * Requirement 11.7: Resolve replies relation
   *
   * @param comment - Parent comment entity
   * @returns Array of reply comments
   */
  @ResolveField(() => [Comment], { name: 'replies' })
  async getReplies(@Parent() comment: Comment): Promise<Comment[]> {
    return this.commentRepository.find({
      where: { parentId: comment.id },
      order: { createdAt: 'ASC' },
    });
  }
}
