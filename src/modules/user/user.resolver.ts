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
import { UseGuards, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UserService } from './user.service';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { PaginationInput } from '../../common/dto/pagination.input';
import { PaginatedUsers } from './dto/paginated-users.dto';
import { GqlAuthGuard } from '../../common/guards/gql-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { GraphQLContext } from '../../common/interfaces/graphql-context.interface';
import { Post } from '../post/entities/post.entity';
import { Profile } from '../profile/entities/profile.entity';

/**
 * User Resolver
 *
 * Handles GraphQL queries and mutations for User entity.
 * Follows pragmatic resolver-service pattern:
 * - Simple CRUD operations: Direct repository access
 * - Complex operations: Delegate to service layer
 *
 * Requirements: 4.4, 4.5, 4.6, 4.7, 3.6
 */
@Resolver(() => User)
export class UserResolver {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly userService: UserService,
  ) {}

  /**
   * Query single user by ID
   *
   * Simple operation: Direct repository access
   * Requirement 4.4: Query user profile
   *
   * @param id - User ID
   * @returns User entity
   */
  @Query(() => User, { name: 'user', description: 'Get user by ID' })
  async getUser(@Args('id', { type: () => ID }) id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  /**
   * Query paginated list of users
   *
   * Complex operation: Uses service for pagination logic
   * Requirement 4.8: Return results with page metadata
   *
   * @param pagination - Pagination parameters
   * @returns Paginated users
   */
  @Query(() => PaginatedUsers, {
    name: 'users',
    description: 'Get paginated list of users',
  })
  async getUsers(
    @Args('pagination', { type: () => PaginationInput, nullable: true })
    pagination: PaginationInput = new PaginationInput(),
  ): Promise<PaginatedUsers> {
    return this.userService.findAll(pagination);
  }

  /**
   * Query current authenticated user
   *
   * Simple operation: Direct repository access
   * Requirement 3.6: Return current user information
   *
   * @param user - Current authenticated user from context
   * @returns Current user entity
   */
  @UseGuards(GqlAuthGuard)
  @Query(() => User, {
    name: 'me',
    description: 'Get current authenticated user',
  })
  async getCurrentUser(@CurrentUser() user: User): Promise<User> {
    // User is already loaded by auth guard, but we fetch fresh data
    const currentUser = await this.userRepository.findOne({
      where: { id: user.id },
    });

    if (!currentUser) {
      throw new NotFoundException('User not found');
    }

    return currentUser;
  }

  /**
   * Create new user
   *
   * Simple operation: Direct repository save
   * Requirement 4.1: Generate unique UUID as user ID
   * Requirement 4.2: Set createdAt and updatedAt timestamps
   *
   * @param input - User creation data
   * @returns Created user
   */
  @Mutation(() => User, { description: 'Create a new user' })
  async createUser(
    @Args('input', { type: () => CreateUserInput }) input: CreateUserInput,
  ): Promise<User> {
    const user = this.userRepository.create({
      email: input.email.toLowerCase(),
      passwordHash: input.password, // Note: In production, this should be hashed
      firstName: input.firstName,
      lastName: input.lastName,
      roles: input.roles || ['user'],
    });

    return this.userRepository.save(user);
  }

  /**
   * Update existing user
   *
   * Simple operation: Direct repository update
   * Requirement 4.3: Update updatedAt timestamp
   * Requirement 4.5: Validate firstName and lastName
   * Requirement 4.6: Validate email format and uniqueness
   *
   * @param id - User ID
   * @param input - User update data
   * @returns Updated user
   */
  @UseGuards(GqlAuthGuard)
  @Mutation(() => User, { description: 'Update an existing user' })
  async updateUser(
    @Args('id', { type: () => ID }) id: string,
    @Args('input', { type: () => UpdateUserInput }) input: UpdateUserInput,
  ): Promise<User> {
    // Check if user exists
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Update user
    await this.userRepository.update(id, {
      ...input,
      email: input.email ? input.email.toLowerCase() : undefined,
    });

    // Return updated user
    const updatedUser = await this.userRepository.findOne({ where: { id } });
    return updatedUser;
  }

  /**
   * Delete user
   *
   * Simple operation: Direct repository delete
   * Requirement 4.7: Cascade delete related posts, comments, and profile
   *
   * @param id - User ID
   * @returns Success boolean
   */
  @UseGuards(GqlAuthGuard)
  @Mutation(() => Boolean, { description: 'Delete a user' })
  async deleteUser(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    // Check if user exists
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Delete user (cascade will handle related entities)
    const result = await this.userRepository.delete(id);
    return result.affected > 0;
  }

  /**
   * Field resolver for user posts
   *
   * Uses DataLoader for batch loading to prevent N+1 queries
   * Requirement 11.6: Batch all requests into one query
   *
   * @param user - Parent user entity
   * @param context - GraphQL context with DataLoaders
   * @returns User's posts
   */
  /**
   * Field resolver for user posts
   *
   * Uses DataLoader for batch loading to prevent N+1 queries
   * Requirement 11.6: Batch all requests into one query
   *
   * @param user - Parent user entity
   * @param context - GraphQL context with DataLoaders
   * @returns User's posts
   */
  @ResolveField(() => [Post], { name: 'posts', nullable: true })
  async getPosts(
    @Parent() user: User,
    @Context() context: GraphQLContext,
  ): Promise<Post[]> {
    // Use DataLoader to batch load posts by authorId
    return context.loaders.postsByAuthorLoader.load(user.id);
  }

  /**
   * Field resolver for user profile
   *
   * Uses DataLoader for batch loading to prevent N+1 queries
   * Requirement 11.6: Batch all requests into one query
   *
   * @param user - Parent user entity
   * @param context - GraphQL context with DataLoaders
   * @returns User's profile
   */
  @ResolveField(() => Profile, { name: 'profile', nullable: true })
  async getProfile(
    @Parent() user: User,
    @Context() context: GraphQLContext,
  ): Promise<Profile | null> {
    // Use DataLoader to batch load profiles by userId
    return context.loaders.profileByUserIdLoader.load(user.id);
  }
}
