import { SetMetadata } from '@nestjs/common';

/**
 * Roles Decorator
 *
 * Marks a GraphQL resolver or REST endpoint as requiring specific roles.
 * Use with RolesGuard to enforce role-based access control.
 *
 * Usage:
 * ```typescript
 * @UseGuards(GqlAuthGuard, RolesGuard)
 * @Roles('admin', 'moderator')
 * @Mutation(() => Boolean)
 * async deleteUser(@Args('id') id: string) {
 *   // Only admin or moderator can execute
 * }
 * ```
 *
 * Requirements:
 * - 3.2: Define required roles for endpoints
 * - 3.5: Support multiple roles (user needs at least one)
 */
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
