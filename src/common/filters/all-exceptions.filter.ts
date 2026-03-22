import {
  ArgumentsHost,
  Catch,
  ConflictException,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Response } from 'express';
import { QueryFailedError, EntityNotFoundError } from 'typeorm';

/**
 * Global exception filter that catches all unhandled exceptions.
 *
 * - Maps TypeORM errors to appropriate HTTP exceptions
 * - Sanitizes 5xx error messages in production
 * - Logs errors with context information
 * - Re-throws for GraphQL requests so Apollo's formatError handles them
 *
 * Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.8, 14.13
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);
  private readonly isProduction = process.env.NODE_ENV === 'production';

  catch(exception: unknown, host: ArgumentsHost): void {
    // For GraphQL requests, re-throw so Apollo's formatError handles it
    if (host.getType<string>() === 'graphql') {
      throw exception;
    }

    // Map TypeORM errors to HTTP exceptions
    const mappedException = this.mapException(exception);

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<{ method: string; url: string }>();

    const status =
      mappedException instanceof HttpException
        ? mappedException.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const httpResponse =
      mappedException instanceof HttpException
        ? (mappedException.getResponse() as { message?: unknown })
        : null;

    const rawMessage: unknown =
      httpResponse?.message ??
      (mappedException instanceof Error
        ? mappedException.message
        : 'Internal server error');

    // Sanitize 5xx messages in production
    const message =
      this.isProduction && status >= 500
        ? 'Internal server error'
        : typeof rawMessage === 'string'
          ? rawMessage
          : JSON.stringify(rawMessage);

    // Log the error
    this.logError(exception, {
      method: request?.method,
      url: request?.url,
      statusCode: status,
      message:
        typeof rawMessage === 'string'
          ? rawMessage
          : JSON.stringify(rawMessage),
    });

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request?.url,
    });
  }

  /**
   * Maps TypeORM-specific errors to NestJS HTTP exceptions.
   */
  private mapException(exception: unknown): unknown {
    if (exception instanceof QueryFailedError) {
      const err = exception as QueryFailedError & { errno?: number };

      // Duplicate entry (MySQL errno 1062)
      if (err.errno === 1062) {
        return new ConflictException(
          'Duplicate entry: resource already exists',
        );
      }

      // Foreign key constraint violations (MySQL errno 1451 / 1452)
      if (err.errno === 1451 || err.errno === 1452) {
        return new ConflictException('Foreign key constraint violation');
      }
    }

    if (exception instanceof EntityNotFoundError) {
      return new NotFoundException('Resource not found');
    }

    return exception;
  }

  /**
   * Logs the error with contextual information.
   * In production, only 5xx errors are logged with stack traces.
   */
  private logError(
    original: unknown,
    context: {
      method?: string;
      url?: string;
      statusCode: number;
      message: string;
    },
  ): void {
    const { method, url, statusCode, message } = context;
    const stack = original instanceof Error ? original.stack : undefined;
    const shouldLogStack = !this.isProduction || statusCode >= 500;

    const logContext = JSON.stringify({ method, url, statusCode, message });

    if (statusCode >= 500) {
      this.logger.error(
        `[${method}] ${url} → ${statusCode}: ${message}`,
        shouldLogStack ? stack : undefined,
        logContext,
      );
    } else if (!this.isProduction) {
      this.logger.warn(
        `[${method}] ${url} → ${statusCode}: ${message}`,
        logContext,
      );
    }
  }
}
