import { SetMetadata } from '@nestjs/common';

/**
 * Public Decorator
 *
 * Marks a GraphQL resolver or REST endpoint as public, skipping authentication.
 * Use this decorator on resolvers that should be accessible without a JWT token.
 *
 * Usage:
 * ```typescript
 * @Public()
 * @Query(() => String)
 * async publicQuery() {
 *   return 'This is public';
 * }
 * ```
 *
 * Requirements:
 * - 3.1: Allow certain endpoints to skip authentication
 * - 3.3: Public endpoints should not require JWT token
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
