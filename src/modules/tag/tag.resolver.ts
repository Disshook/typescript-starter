import {
  Resolver,
  Query,
  Mutation,
  Args,
  ID,
  ResolveField,
  Parent,
} from '@nestjs/graphql';
import {
  UseGuards,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tag } from './entities/tag.entity';
import { CreateTagInput } from './dto/create-tag.input';
import { UpdateTagInput } from './dto/update-tag.input';
import { PaginatedTags } from './dto/paginated-tags.dto';
import { PaginationInput } from '../../common/dto/pagination.input';
import { GqlAuthGuard } from '../../common/guards/gql-auth.guard';
import { Post } from '../post/entities/post.entity';
import {
  resolvePagination,
  buildPageInfo,
} from '../../common/utils/pagination.util';

/**
 * Tag Resolver
 *
 * Handles GraphQL queries and mutations for Tag entity.
 * Follows pragmatic resolver-service pattern:
 * - All operations are simple CRUD: Direct repository access
 * - Uniqueness validation for name and slug
 *
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.7, 8.8, 8.9
 */
@Resolver(() => Tag)
export class TagResolver {
  constructor(
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
  ) {}

  /**
   * Get a single tag by ID
   *
   * Simple operation: Direct repository.findOne
   * Requirement 8.1: Return tag by ID
   * Requirement 8.8: Return not found error if tag doesn't exist
   *
   * @param id - Tag ID
   * @returns Tag entity
   */
  @Query(() => Tag, { name: 'tag', description: 'Get a tag by ID' })
  async getTag(@Args('id', { type: () => ID }) id: string): Promise<Tag> {
    const tag = await this.tagRepository.findOne({ where: { id } });

    if (!tag) {
      throw new NotFoundException(`Tag with ID ${id} not found`);
    }

    return tag;
  }

  /**
   * Get paginated list of tags
   *
   * Simple operation: Direct repository.find with pagination
   * Requirement 8.7: Return paginated list of tags
   * Requirement 8.9: Support sorting by name, slug, or createdAt
   *
   * @param pagination - Pagination parameters
   * @returns Paginated tags
   */
  @Query(() => PaginatedTags, {
    name: 'tags',
    description: 'Get paginated list of tags',
  })
  async getTags(
    @Args('pagination', { type: () => PaginationInput, nullable: true })
    pagination: PaginationInput = new PaginationInput(),
  ): Promise<PaginatedTags> {
    const { page, limit, sortBy, sortOrder, offset } =
      resolvePagination(pagination);

    // Validate sortBy field to prevent injection
    const allowedSortFields = ['name', 'slug', 'createdAt'];
    const safeSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : 'createdAt';

    const [items, totalItems] = await this.tagRepository.findAndCount({
      order: { [safeSortBy]: sortOrder },
      skip: offset,
      take: limit,
    });

    return { items, pageInfo: buildPageInfo(page, limit, totalItems) };
  }

  /**
   * Create a new tag
   *
   * Simple operation: Direct repository.save
   * Requirement 8.2: Validate name is unique
   * Requirement 8.3: Validate slug is unique
   *
   * @param input - Tag creation data
   * @returns Created tag
   */
  @UseGuards(GqlAuthGuard)
  @Mutation(() => Tag, { description: 'Create a new tag' })
  async createTag(
    @Args('input', { type: () => CreateTagInput }) input: CreateTagInput,
  ): Promise<Tag> {
    // Requirement 8.2: Check name uniqueness
    const existingByName = await this.tagRepository.findOne({
      where: { name: input.name },
    });
    if (existingByName) {
      throw new ConflictException(
        `Tag with name "${input.name}" already exists`,
      );
    }

    // Requirement 8.3: Check slug uniqueness
    const existingBySlug = await this.tagRepository.findOne({
      where: { slug: input.slug },
    });
    if (existingBySlug) {
      throw new ConflictException(
        `Tag with slug "${input.slug}" already exists`,
      );
    }

    const tag = this.tagRepository.create(input);
    return this.tagRepository.save(tag);
  }

  /**
   * Update an existing tag
   *
   * Simple operation: Direct repository.update
   * Requirement 8.2: Validate name uniqueness if name is being updated
   * Requirement 8.3: Validate slug uniqueness if slug is being updated
   * Requirement 8.8: Return not found error if tag doesn't exist
   *
   * @param id - Tag ID
   * @param input - Tag update data
   * @returns Updated tag
   */
  @UseGuards(GqlAuthGuard)
  @Mutation(() => Tag, { description: 'Update an existing tag' })
  async updateTag(
    @Args('id', { type: () => ID }) id: string,
    @Args('input', { type: () => UpdateTagInput }) input: UpdateTagInput,
  ): Promise<Tag> {
    const tag = await this.tagRepository.findOne({ where: { id } });

    if (!tag) {
      throw new NotFoundException(`Tag with ID ${id} not found`);
    }

    // Requirement 8.2: Check name uniqueness if name is being updated
    if (input.name && input.name !== tag.name) {
      const existingByName = await this.tagRepository.findOne({
        where: { name: input.name },
      });
      if (existingByName) {
        throw new ConflictException(
          `Tag with name "${input.name}" already exists`,
        );
      }
    }

    // Requirement 8.3: Check slug uniqueness if slug is being updated
    if (input.slug && input.slug !== tag.slug) {
      const existingBySlug = await this.tagRepository.findOne({
        where: { slug: input.slug },
      });
      if (existingBySlug) {
        throw new ConflictException(
          `Tag with slug "${input.slug}" already exists`,
        );
      }
    }

    await this.tagRepository.update(id, input);
    return this.tagRepository.findOne({ where: { id } });
  }

  /**
   * Field resolver for tag's associated posts
   *
   * Loads posts relation from database via join
   * Requirement 8.7: Return posts associated with a tag
   *
   * @param tag - Parent tag entity
   * @returns Posts associated with the tag
   */
  @ResolveField(() => [Post], { name: 'posts' })
  async getPosts(@Parent() tag: Tag): Promise<Post[]> {
    const tagWithPosts = await this.tagRepository.findOne({
      where: { id: tag.id },
      relations: ['posts'],
    });

    return tagWithPosts?.posts || [];
  }
}
