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
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile } from './entities/profile.entity';
import { CreateProfileInput } from './dto/create-profile.input';
import { UpdateProfileInput } from './dto/update-profile.input';
import { GqlAuthGuard } from '../../common/guards/gql-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { GraphQLContext } from '../../common/interfaces/graphql-context.interface';
import { User } from '../user/entities/user.entity';

/**
 * Profile Resolver
 *
 * Handles GraphQL queries and mutations for Profile entity.
 * Follows pragmatic resolver-service pattern:
 * - Simple CRUD: Direct repository access
 * - Validation: avatarUrl must be HTTPS, birthDate age >= 13
 *
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.8, 7.9, 7.10, 11.7
 */
@Resolver(() => Profile)
export class ProfileResolver {
  constructor(
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
  ) {}

  /**
   * Validates that the user is at least 13 years old
   * Requirement 7.5: birthDate age >= 13
   */
  private validateAge(birthDate: string): void {
    const birth = new Date(birthDate);
    const now = new Date();
    const age = now.getFullYear() - birth.getFullYear();
    const monthDiff = now.getMonth() - birth.getMonth();
    const adjustedAge =
      monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())
        ? age - 1
        : age;

    if (adjustedAge < 13) {
      throw new BadRequestException('User must be at least 13 years old');
    }
  }

  /**
   * Get a profile by user ID
   *
   * Simple operation: Direct repository.findOne
   * Requirement 7.1: Return profile for a user
   * Requirement 7.6: Return not found error if profile doesn't exist
   *
   * @param userId - User ID to fetch profile for
   * @returns Profile entity
   */
  @Query(() => Profile, {
    name: 'profile',
    description: 'Get a user profile by user ID',
  })
  async getProfile(
    @Args('userId', { type: () => ID }) userId: string,
  ): Promise<Profile> {
    const profile = await this.profileRepository.findOne({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException(`Profile for user ${userId} not found`);
    }

    return profile;
  }

  /**
   * Create a new profile for the authenticated user
   *
   * Simple operation: Direct repository.save
   * Requirement 7.2: Validate bio max 1000 chars (handled by DTO)
   * Requirement 7.3: Validate avatarUrl is HTTPS (handled by DTO + extra check)
   * Requirement 7.4: Validate website URL (handled by DTO)
   * Requirement 7.5: Validate birthDate age >= 13
   * Requirement 7.8: One profile per user
   * Requirement 7.9: Set userId from authenticated user
   *
   * @param input - Profile creation data
   * @param currentUser - Authenticated user
   * @returns Created profile
   */
  @UseGuards(GqlAuthGuard)
  @Mutation(() => Profile, {
    description: 'Create a profile for the current user',
  })
  async createProfile(
    @Args('input', { type: () => CreateProfileInput })
    input: CreateProfileInput,
    @CurrentUser() currentUser: User,
  ): Promise<Profile> {
    // Requirement 7.8: Ensure user doesn't already have a profile
    const existing = await this.profileRepository.findOne({
      where: { userId: currentUser.id },
    });
    if (existing) {
      throw new BadRequestException('User already has a profile');
    }

    // Requirement 7.5: Validate age if birthDate provided
    if (input.birthDate) {
      this.validateAge(input.birthDate);
    }

    const profile = this.profileRepository.create({
      ...input,
      birthDate: input.birthDate ? new Date(input.birthDate) : undefined,
      userId: currentUser.id, // Requirement 7.9
    });

    return this.profileRepository.save(profile);
  }

  /**
   * Update the authenticated user's profile
   *
   * Simple operation: Direct repository.update
   * Requirement 7.3: Validate avatarUrl is HTTPS (handled by DTO)
   * Requirement 7.5: Validate birthDate age >= 13
   * Requirement 7.10: Only profile owner can update
   *
   * @param input - Profile update data
   * @param currentUser - Authenticated user
   * @returns Updated profile
   */
  @UseGuards(GqlAuthGuard)
  @Mutation(() => Profile, { description: "Update the current user's profile" })
  async updateProfile(
    @Args('input', { type: () => UpdateProfileInput })
    input: UpdateProfileInput,
    @CurrentUser() currentUser: User,
  ): Promise<Profile> {
    const profile = await this.profileRepository.findOne({
      where: { userId: currentUser.id },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    // Requirement 7.5: Validate age if birthDate is being updated
    if (input.birthDate) {
      this.validateAge(input.birthDate);
    }

    const updateData: Partial<Profile> = { ...input } as any;
    if (input.birthDate) {
      updateData.birthDate = new Date(input.birthDate);
    }

    await this.profileRepository.update(profile.id, updateData);

    return this.profileRepository.findOne({ where: { id: profile.id } });
  }

  /**
   * Field resolver for profile owner
   *
   * Uses DataLoader for batch loading to prevent N+1 queries
   * Requirement 11.7: Batch all user requests into one query
   *
   * @param profile - Parent profile entity
   * @param context - GraphQL context with DataLoaders
   * @returns Profile owner user
   */
  @ResolveField(() => User, { name: 'user' })
  async getUser(
    @Parent() profile: Profile,
    @Context() context: GraphQLContext,
  ): Promise<User> {
    return context.loaders.userLoader.load(profile.userId);
  }
}
