import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { User } from '../../modules/user/entities/user.entity';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Roles Authorization Guard
 *
 * Guard that enforces role-based access control.
 * This guard:
 * 1. Extracts required roles from @Roles() decorator
 * 2. Gets authenticated user from request
 * 3. Checks if user has at least one of the required roles
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
 * - 3.2: Verify user has required roles
 * - 3.4: Return forbidden error when user lacks required roles
 * - 3.5: Support multiple roles (user needs at least one)
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  /**
   * Determines if the request should be allowed based on user roles
   *
   * @param context - Execution context
   * @returns true if user has required role, false otherwise
   */
  canActivate(context: ExecutionContext): boolean {
    // Get required roles from decorator
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no roles required, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Extract user from GraphQL context
    const ctx = GqlExecutionContext.create(context);
    const user = ctx.getContext().req.user as User;

    // If no user, deny access (should be caught by auth guard first)
    if (!user) {
      return false;
    }

    // Check if user has at least one of the required roles
    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}
