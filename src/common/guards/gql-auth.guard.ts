import { ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { JwtAuthGuard } from './jwt-auth.guard';

/**
 * GraphQL Authentication Guard
 *
 * Extends JwtAuthGuard to work with GraphQL context.
 * This guard:
 * 1. Extracts request from GraphQL context
 * 2. Delegates to JwtAuthGuard for authentication
 * 3. Attaches user to GraphQL context
 *
 * Usage:
 * ```typescript
 * @UseGuards(GqlAuthGuard)
 * @Query(() => User)
 * async me(@Context() context) {
 *   return context.req.user;
 * }
 * ```
 *
 * Requirements:
 * - 3.1: Verify valid JWT token in GraphQL context
 * - 3.3: Return unauthorized error for missing/invalid tokens
 */
@Injectable()
export class GqlAuthGuard extends JwtAuthGuard {
  /**
   * Extracts request from GraphQL context
   *
   * @param context - Execution context
   * @returns HTTP request object
   */
  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req;
  }
}
