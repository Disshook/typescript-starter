import { Injectable, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * JWT Authentication Guard
 *
 * Guard that enforces JWT authentication on protected routes.
 * This guard:
 * 1. Checks if route is marked as @Public()
 * 2. If not public, validates JWT token using JwtStrategy
 * 3. Attaches authenticated user to request
 *
 * Requirements:
 * - 3.1: Verify valid JWT token is present in request
 * - 3.3: Return unauthorized error when token is missing or invalid
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  /**
   * Determines if the request should be allowed
   *
   * @param context - Execution context
   * @returns true if allowed, false otherwise
   */
  canActivate(context: ExecutionContext) {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Skip authentication for public routes
    if (isPublic) {
      return true;
    }

    // Validate JWT token using Passport strategy
    return super.canActivate(context);
  }
}
