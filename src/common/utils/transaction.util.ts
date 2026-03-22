import { DataSource, EntityManager } from 'typeorm';
import { Logger } from '@nestjs/common';

const logger = new Logger('TransactionUtil');

/**
 * MySQL error codes that indicate a deadlock
 * ER_LOCK_DEADLOCK = 1213
 */
const DEADLOCK_ERROR_CODES = new Set([1213, 'ER_LOCK_DEADLOCK']);

/**
 * Default retry configuration for deadlock scenarios
 * Requirement 10.8: Retry transaction up to 3 times on deadlock
 */
const DEFAULT_MAX_RETRIES = 3;
const BASE_BACKOFF_MS = 50;

/**
 * Checks whether a database error is a deadlock error
 */
function isDeadlockError(error: unknown): boolean {
  if (error && typeof error === 'object') {
    const err = error as Record<string, unknown>;
    if (DEADLOCK_ERROR_CODES.has(err['errno'] as number)) return true;
    if (DEADLOCK_ERROR_CODES.has(err['code'] as string)) return true;
  }
  return false;
}

/**
 * Executes a callback within a database transaction with automatic rollback
 * and optional retry logic for deadlock scenarios.
 *
 * Requirement 10.1: Execute all operations within a single database transaction
 * Requirement 10.2: Commit transaction when all operations succeed
 * Requirement 10.3: Rollback all changes when any operation fails
 * Requirement 10.4: Restore state to before transaction began on rollback
 * Requirement 10.8: Retry transaction up to 3 times on deadlock
 *
 * @param dataSource - TypeORM DataSource instance
 * @param work - Async callback receiving the EntityManager for the transaction
 * @param maxRetries - Maximum number of retry attempts on deadlock (default: 3)
 * @returns The result of the callback
 * @throws The last error if all retries are exhausted or a non-deadlock error occurs
 *
 * @example
 * ```typescript
 * const result = await withTransaction(dataSource, async (manager) => {
 *   const user = manager.create(User, userData);
 *   const savedUser = await manager.save(User, user);
 *   const profile = manager.create(Profile, { ...profileData, userId: savedUser.id });
 *   await manager.save(Profile, profile);
 *   return savedUser;
 * });
 * ```
 */
export async function withTransaction<T>(
  dataSource: DataSource,
  work: (manager: EntityManager) => Promise<T>,
  maxRetries: number = DEFAULT_MAX_RETRIES,
): Promise<T> {
  let attempt = 0;

  while (true) {
    attempt++;
    try {
      // Execute work inside a transaction; TypeORM handles BEGIN/COMMIT/ROLLBACK
      const result = await dataSource.transaction(work);
      return result;
    } catch (error) {
      // Requirement 10.8: Retry on deadlock with exponential backoff
      if (isDeadlockError(error) && attempt < maxRetries) {
        const backoffMs = BASE_BACKOFF_MS * Math.pow(2, attempt - 1);
        logger.warn(
          `Deadlock detected on attempt ${attempt}/${maxRetries}. Retrying in ${backoffMs}ms...`,
        );
        await sleep(backoffMs);
        continue;
      }

      // Requirement 10.3 / 10.7: Rollback is automatic via TypeORM on throw
      if (attempt > 1) {
        logger.error(
          `Transaction failed after ${attempt} attempts`,
          error instanceof Error ? error.stack : String(error),
        );
      }

      throw error;
    }
  }
}

/**
 * Executes a callback using an existing EntityManager's transaction,
 * useful when you already have a manager (e.g., inside a nested operation).
 *
 * Requirement 10.1: Execute all operations within a single database transaction
 * Requirement 10.2: Commit transaction when all operations succeed
 * Requirement 10.3: Rollback all changes when any operation fails
 *
 * @param manager - Existing TypeORM EntityManager
 * @param work - Async callback receiving the same EntityManager
 * @returns The result of the callback
 */
export async function withManagerTransaction<T>(
  manager: EntityManager,
  work: (manager: EntityManager) => Promise<T>,
): Promise<T> {
  return manager.transaction(work);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
