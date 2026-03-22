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
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Post } from './entities/post.entity';
import { PostService } from './post.service';
import { CreatePostInput } from './dto/create-post.input';
import { UpdatePostInput } from './dto/update-post.input';
import { PostFiltersInput } from './dto/post-filters.input';
import { PaginationInput } from '../../common/dto/pagination.input';
import { PaginatedPosts } from './dto/paginated-posts.dto';
import { GqlAuthGuard } from '../../common/guards/gql-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { GraphQLContext } from '../../common/interfaces/graphql-context.interface';
import { User } from '../user/entities/user.entity';
import { Comment } from '../comment/entities/comment.entity';
import { Tag } from '../tag/entities/tag.entity';

/**
 * Post Resolver
 *
 * Handles GraphQL queries and mutations for Post entity.
 * Follows pragmatic resolver-service pattern:
 * - Simple CRUD operations: Direct repository access
 * - Complex operations: Delegate to service layer
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.9, 5.13, 5.15, 5.16, 3.7, 11.6, 11.7
 */
@Resolver(() => Post)
export class PostResolver {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
    private readonly postService: PostService,
  ) {}

  /**
   * Query single post by ID with viewCount increment
   *
   * Simple operation with side effect: Direct repository access
   * Requirement 5.13: Increment viewCount when querying a post
   *
   * @param id - Post ID
   * @returns Post entity
   */
  @Query(() => Post, { name: 'post', description: 'Get post by ID' })
  async getPost(@Args('id', { type: () => ID }) id: string): Promise<Post> {
    const post = await this.postRepository.findOne({ where: { id } });

    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    // Increment view count (Requirement 5.13)
    post.viewCount += 1;
    await this.postRepository.save(post);

    return post;
  }

  /**
   * Query paginated list of posts
   *
   * Complex operation: Uses service for pagination logic
   * Requirement 5.12: Return paginated posts with filtering and sorting
   *
   * @param pagination - Pagination parameters
   * @param filters - Optional filters
   * @returns Paginated posts
   */
  @Query(() => PaginatedPosts, {
    name: 'posts',
    description: 'Get paginated list of posts',
  })
  async getPosts(
    @Args('pagination', { type: () => PaginationInput, nullable: true })
    pagination: PaginationInput = new PaginationInput(),
    @Args('filters', { type: () => PostFiltersInput, nullable: true })
    filters?: PostFiltersInput,
  ): Promise<PaginatedPosts> {
    return this.postService.findAll(pagination, filters);
  }

  /**
   * Search posts with full-text search
   *
   * Complex operation: Uses service for search logic
   * Requirement 21.6: Full-text search on title and content
   *
   * @param searchText - Text to search for
   * @param pagination - Pagination parameters
   * @returns Paginated search results
   */
  @Query(() => PaginatedPosts, {
    name: 'searchPosts',
    description: 'Search posts by text',
  })
  async searchPosts(
    @Args('searchText', { type: () => String }) searchText: string,
    @Args('pagination', { type: () => PaginationInput, nullable: true })
    pagination: PaginationInput = new PaginationInput(),
  ): Promise<PaginatedPosts> {
    return this.postService.searchPosts(searchText, pagination);
  }

  /**
   * Create new post
   *
   * Simple operation: Direct repository save
   * Requirement 5.1: Generate unique UUID as post ID
   * Requirement 5.2: Set status to DRAFT by default
   * Requirement 5.3: Set viewCount to 0
   * Requirement 5.4: Set authorId to authenticated user's ID
   * Requirement 5.5: Validate slug is unique
   *
   * @param input - Post creation data
   * @param currentUser - Authenticated user
   * @returns Created post
   */
  @UseGuards(GqlAuthGuard)
  @Mutation(() => Post, { description: 'Create a new post' })
  async createPost(
    @Args('input', { type: () => CreatePostInput }) input: CreatePostInput,
    @CurrentUser() currentUser: User,
  ): Promise<Post> {
    // Check if slug already exists (Requirement 5.14)
    const existingPost = await this.postRepository.findOne({
      where: { slug: input.slug },
    });

    if (existingPost) {
      throw new ConflictException(
        `Post with slug "${input.slug}" already exists`,
      );
    }

    // Create post entity
    const post = this.postRepository.create({
      title: input.title,
      content: input.content,
      slug: input.slug,
      authorId: currentUser.id, // Requirement 5.4
      viewCount: 0, // Requirement 5.3
      // status defaults to DRAFT (Requirement 5.2)
    });

    // Save post
    const savedPost = await this.postRepository.save(post);

    // Associate tags if provided
    if (input.tagIds && input.tagIds.length > 0) {
      const tags = await this.tagRepository.findBy({
        id: In(input.tagIds),
      });
      savedPost.tags = tags;
      await this.postRepository.save(savedPost);
    }

    return savedPost;
  }

  /**
   * Update existing post with authorization check
   *
   * Simple operation with auth: Direct repository update
   * Requirement 5.9: Update updatedAt timestamp
   * Requirement 5.15: Verify user owns post or has admin role
   *
   * @param id - Post ID
   * @param input - Post update data
   * @param currentUser - Authenticated user
   * @returns Updated post
   */
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Mutation(() => Post, { description: 'Update an existing post' })
  async updatePost(
    @Args('id', { type: () => ID }) id: string,
    @Args('input', { type: () => UpdatePostInput }) input: UpdatePostInput,
    @CurrentUser() currentUser: User,
  ): Promise<Post> {
    // Check if post exists
    const post = await this.postRepository.findOne({ where: { id } });

    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    // Authorization check (Requirement 5.15)
    if (
      post.authorId !== currentUser.id &&
      !currentUser.roles?.includes('admin')
    ) {
      throw new ForbiddenException(
        'You do not have permission to update this post',
      );
    }

    // Check slug uniqueness if slug is being updated
    if (input.slug && input.slug !== post.slug) {
      const existingPost = await this.postRepository.findOne({
        where: { slug: input.slug },
      });

      if (existingPost) {
        throw new ConflictException(
          `Post with slug "${input.slug}" already exists`,
        );
      }
    }

    // Update post
    await this.postRepository.update(id, input);

    // Handle tag updates if provided
    if (input.tagIds !== undefined) {
      const updatedPost = await this.postRepository.findOne({
        where: { id },
        relations: ['tags'],
      });

      if (input.tagIds.length > 0) {
        const tags = await this.tagRepository.findBy({
          id: In(input.tagIds),
        });
        updatedPost.tags = tags;
      } else {
        updatedPost.tags = [];
      }

      await this.postRepository.save(updatedPost);
    }

    // Return updated post
    const updatedPost = await this.postRepository.findOne({ where: { id } });
    return updatedPost;
  }

  /**
   * Delete post with authorization check
   *
   * Simple operation with auth: Direct repository delete
   * Requirement 5.10: Cascade delete all related comments
   * Requirement 5.11: Remove all post_tags junction records
   * Requirement 5.16: Return not found error if post doesn't exist
   * Requirement 3.7: Verify user owns post or has admin role
   *
   * @param id - Post ID
   * @param currentUser - Authenticated user
   * @returns Success boolean
   */
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Mutation(() => Boolean, { description: 'Delete a post' })
  async deletePost(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() currentUser: User,
  ): Promise<boolean> {
    // Check if post exists
    const post = await this.postRepository.findOne({ where: { id } });

    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    // Authorization check (Requirement 3.7)
    if (
      post.authorId !== currentUser.id &&
      !currentUser.roles?.includes('admin')
    ) {
      throw new ForbiddenException(
        'You do not have permission to delete this post',
      );
    }

    // Delete post (cascade will handle related entities)
    const result = await this.postRepository.delete(id);
    return result.affected > 0;
  }

  /**
   * Publish a post (change status to PUBLISHED)
   *
   * Complex operation: Uses service for status update logic
   * Requirement 5.8: Set publishedAt when status changes to PUBLISHED
   *
   * @param id - Post ID
   * @param currentUser - Authenticated user
   * @returns Published post
   */
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Mutation(() => Post, { description: 'Publish a post' })
  async publishPost(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() currentUser: User,
  ): Promise<Post> {
    // Check if post exists
    const post = await this.postRepository.findOne({ where: { id } });

    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    // Authorization check
    if (
      post.authorId !== currentUser.id &&
      !currentUser.roles?.includes('admin')
    ) {
      throw new ForbiddenException(
        'You do not have permission to publish this post',
      );
    }

    // Use service to publish post
    return this.postService.publishPost(id);
  }

  /**
   * Field resolver for post author
   *
   * Uses DataLoader for batch loading to prevent N+1 queries
   * Requirement 11.6: Batch all author requests into one query
   *
   * @param post - Parent post entity
   * @param context - GraphQL context with DataLoaders
   * @returns Post author
   */
  @ResolveField(() => User, { name: 'author' })
  async getAuthor(
    @Parent() post: Post,
    @Context() context: GraphQLContext,
  ): Promise<User> {
    // Use DataLoader to batch load authors by ID
    return context.loaders.userLoader.load(post.authorId);
  }

  /**
   * Field resolver for post comments
   *
   * Uses DataLoader for batch loading to prevent N+1 queries
   * Requirement 11.7: Batch all comment requests into one query
   *
   * @param post - Parent post entity
   * @param context - GraphQL context with DataLoaders
   * @returns Post comments
   */
  @ResolveField(() => [Comment], { name: 'comments' })
  getComments(
    @Parent() post: Post,
    @Context() context: GraphQLContext,
  ): Promise<Comment[]> {
    // Use DataLoader to batch load comments by postId
    return context.loaders.commentsByPostLoader.load(post.id);
  }

  /**
   * Field resolver for post tags
   *
   * Loads tags relation from database
   * Requirement 11.7: Resolve tags relation
   *
   * @param post - Parent post entity
   * @returns Post tags
   */
  @ResolveField(() => [Tag], { name: 'tags' })
  async getTags(@Parent() post: Post): Promise<Tag[]> {
    // Load post with tags relation
    const postWithTags = await this.postRepository.findOne({
      where: { id: post.id },
      relations: ['tags'],
    });

    return postWithTags?.tags || [];
  }
}
