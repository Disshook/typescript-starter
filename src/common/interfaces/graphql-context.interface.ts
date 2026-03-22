import { Request, Response } from 'express';
import { User } from '../../modules/user/entities/user.entity';
import { DataLoaderRegistry } from './dataloader-registry.interface';

/**
 * GraphQL Context Interface
 *
 * Defines the structure of the GraphQL context object.
 * This context is available in all resolvers and field resolvers.
 *
 * Properties:
 * - req: Express request object with authenticated user
 * - res: Express response object
 * - loaders: DataLoader instances for batch loading
 */
export interface GraphQLContext {
  /**
   * Express request object
   * Contains authenticated user when auth guard is applied
   */
  req: Request & { user?: User };

  /**
   * Express response object
   */
  res: Response;

  /**
   * DataLoader instances for batch loading
   * Prevents N+1 query problems
   * Requirements: 11.4, 11.5
   */
  loaders: DataLoaderRegistry;
}
