import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import { User } from './entities/user.entity';
import { PaginationInput } from '../../common/dto/pagination.input';
import { CreateUserInput } from './dto/create-user.input';
import { CreateProfileInput } from '../profile/dto/create-profile.input';
import { Profile } from '../profile/entities/profile.entity';
import * as bcrypt from 'bcrypt';
import { withTransaction } from '../../common/utils/transaction.util';
import {
  resolvePagination,
  buildPageInfo,
} from '../../common/utils/pagination.util';

/**
 * User Service
 *
 * Handles complex user business logic including:
 * - Batch loading for DataLoader
 * - Pagination with filtering and sorting
 * - User registration with password hashing
 * - Transaction-based user creation with profile
 *
 * Requirements: 4.8, 4.9, 10.5
 */
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Find users by IDs for DataLoader batch loading
   *
   * Requirement 11.1: Batch multiple requests into single query
   * Requirement 11.2: Execute exactly one database query using IN clause
   * Requirement 11.3: Maintain same order as input IDs
   * Requirement 11.9: Return null for missing IDs
   *
   * @param ids - Array of user IDs
   * @returns Array of users in same order as input IDs
   */
  async findByIds(ids: string[]): Promise<(User | null)[]> {
    // Deduplicate IDs
    const uniqueIds = [...new Set(ids)];

    // Batch query using IN clause
    const users = await this.userRepository.find({
      where: { id: In(uniqueIds) },
    });

    // Create a map for O(1) lookup
    const userMap = new Map<string, User>();
    users.forEach((user) => {
      userMap.set(user.id, user);
    });

    // Return results in the same order as input IDs
    // Return null for missing users
    return ids.map((id) => userMap.get(id) || null);
  }

  /**
   * Find all users with pagination, filtering, and sorting
   *
   * Requirement 4.8: Return results with page metadata
   * Requirement 12.4: Calculate offset from page and limit
   * Requirement 12.5: Return items for requested page
   * Requirement 12.6: Return pageInfo with metadata
   * Requirement 12.10: Support sorting
   *
   * @param pagination - Pagination parameters
   * @returns Paginated users with metadata
   */
  async findAll(pagination: PaginationInput) {
    const { page, limit, sortBy, sortOrder, offset } =
      resolvePagination(pagination);

    const [users, total] = await this.userRepository
      .createQueryBuilder('user')
      .skip(offset)
      .take(limit)
      .orderBy(`user.${sortBy}`, sortOrder)
      .getManyAndCount();

    return {
      items: users,
      pageInfo: buildPageInfo(page, limit, total),
    };
  }

  /**
   * Register a new user with password hashing and validation
   *
   * Requirement 2.1: Create user with hashed password
   * Requirement 2.2: Assign default role of "user"
   * Requirement 2.9: Return conflict error for duplicate email
   * Requirement 19.5: Hash password using bcrypt with 10 salt rounds
   *
   * @param input - User registration data
   * @returns Created user
   */
  async registerUser(input: CreateUserInput): Promise<User> {
    // Check if email already exists (Requirement 2.9)
    const existingUser = await this.userRepository.findOne({
      where: { email: input.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    // Hash password (Requirement 19.5)
    const passwordHash = await bcrypt.hash(input.password, 10);

    // Create user with default role (Requirement 2.2)
    const user = this.userRepository.create({
      email: input.email.toLowerCase(),
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      roles: input.roles || ['user'],
    });

    return this.userRepository.save(user);
  }

  /**
   * Create user with profile in a transaction
   *
   * Requirement 10.1: Execute operations within single transaction
   * Requirement 10.2: Commit transaction on success
   * Requirement 10.3: Rollback transaction on failure
   * Requirement 10.5: Create user and profile atomically
   *
   * @param userData - User creation data
   * @param profileData - Profile creation data
   * @returns Created user with profile
   */
  async createUserWithProfile(
    userData: CreateUserInput,
    profileData: CreateProfileInput,
  ): Promise<User> {
    // Check if email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: userData.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    // Execute in transaction (Requirement 10.1)
    return await withTransaction(this.dataSource, async (manager) => {
      // Hash password
      const passwordHash = await bcrypt.hash(userData.password, 10);

      // Create and save user
      const user = manager.create(User, {
        email: userData.email.toLowerCase(),
        passwordHash,
        firstName: userData.firstName,
        lastName: userData.lastName,
        roles: userData.roles || ['user'],
      });

      const savedUser = await manager.save(User, user);

      // Create and save profile
      const profile = manager.create(Profile, {
        ...profileData,
        userId: savedUser.id,
      });

      await manager.save(Profile, profile);

      // Load user with profile relation
      const userWithProfile = await manager.findOne(User, {
        where: { id: savedUser.id },
        relations: ['profile'],
      });

      return userWithProfile;
    });
    // Transaction commits on success (Requirement 10.2)
    // Transaction rolls back on error (Requirement 10.3)
  }
}
