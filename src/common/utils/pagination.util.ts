import { BadRequestException } from '@nestjs/common';
import { PageInfo } from '../dto/page-info.dto';
import { PaginationInput } from '../dto/pagination.input';

/**
 * Pagination Utility
 *
 * Shared helpers for page-based pagination across all list queries.
 *
 * Requirements:
 * - 12.4: Calculate offset from page and limit
 * - 12.5: Return items for requested page
 * - 12.6: Return pageInfo with metadata
 * - 12.7: totalPages = ceil(totalItems / pageSize)
 * - 12.8: hasNextPage = currentPage < totalPages
 * - 12.9: hasPreviousPage = currentPage > 1
 * - 12.11: Validate page >= 1
 * - 12.12: Validate limit between 1 and 100
 */

/**
 * Validate pagination parameters and throw if invalid.
 *
 * Requirement 12.11: page must be >= 1
 * Requirement 12.12: limit must be between 1 and 100
 */
export function validatePagination(page: number, limit: number): void {
  if (!Number.isInteger(page) || page < 1) {
    throw new BadRequestException('Page must be an integer >= 1');
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new BadRequestException('Limit must be an integer between 1 and 100');
  }
}

/**
 * Calculate the SQL offset from page number and page size.
 *
 * Requirement 12.4: offset = (page - 1) * limit
 */
export function calculateOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * Build a PageInfo object from query result metadata.
 *
 * Requirement 12.6: Return pageInfo with all required fields
 * Requirement 12.7: totalPages = ceil(totalItems / pageSize)
 * Requirement 12.8: hasNextPage = currentPage < totalPages
 * Requirement 12.9: hasPreviousPage = currentPage > 1
 */
export function buildPageInfo(
  page: number,
  limit: number,
  totalItems: number,
): PageInfo {
  const totalPages = limit > 0 ? Math.ceil(totalItems / limit) : 0;

  return {
    currentPage: page,
    pageSize: limit,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

/**
 * Resolve pagination defaults and return normalised values.
 *
 * Requirement 12.10: Support sortBy and sortOrder with safe defaults
 */
export function resolvePagination(pagination: PaginationInput) {
  const page = pagination.page ?? 1;
  const limit = pagination.limit ?? 10;
  const sortOrder: 'ASC' | 'DESC' = pagination.sortOrder ?? 'DESC';
  const sortBy = pagination.sortBy ?? 'createdAt';

  validatePagination(page, limit);

  return {
    page,
    limit,
    sortOrder,
    sortBy,
    offset: calculateOffset(page, limit),
  };
}
