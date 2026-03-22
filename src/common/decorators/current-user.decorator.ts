import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { User } from '../../modules/user/entities/user.entity';

/**
 * Current User Decorator
 *
 * Parameter decorator that extracts the authenticated user from GraphQL context.
 * Use this decorator to access the current user in resolvers.
 *
 * Usage:
 * ```typescript
 * @UseGuards(GqlAuthGuard)
 * @Query(() => User)
 * async me(@CurrentUser() user: User) {
 *   return user;
 * }
 * ```
 *
 * Requirements:
 * - 3.6: Extract current user from GraphQL context
 * - 3.1: User must be authenticated (attached by auth guard)
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext): User => {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req.user;
  },
);
