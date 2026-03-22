import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { GraphQLError } from 'graphql';

/**
 * GraphQL-specific exception filter.
 *
 * - Formats validation errors (BadRequestException with array messages) into
 *   field-specific { field, message }[] structures
 * - Maps UnauthorizedException → UNAUTHENTICATED GraphQL error code
 * - Maps ForbiddenException → FORBIDDEN GraphQL error code
 * - Re-throws other exceptions for Apollo's formatError to handle
 *
 * Requirements: 14.2, 14.3, 14.4
 */
@Catch(Error)
export class GqlExceptionFilter implements ExceptionFilter {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  catch(exception: Error, _host: ArgumentsHost): never {
    // Handle validation errors from class-validator (BadRequestException with array)
    if (exception instanceof BadRequestException) {
      const response = exception.getResponse() as Record<string, unknown>;
      const rawMessages = Array.isArray(response?.['message'])
        ? (response['message'] as string[])
        : [
            typeof response?.['message'] === 'string'
              ? response['message']
              : exception.message,
          ];

      // Parse field-specific messages from class-validator format:
      // e.g. "email must be an email" → { field: 'email', message: 'must be an email' }
      const fieldErrors = rawMessages.map((msg: string) => {
        const spaceIdx = msg.indexOf(' ');
        if (spaceIdx !== -1) {
          return {
            field: msg.substring(0, spaceIdx),
            message: msg.substring(spaceIdx + 1),
          };
        }
        return { field: 'unknown', message: msg };
      });

      throw new GraphQLError('Validation failed', {
        extensions: {
          code: 'BAD_USER_INPUT',
          fieldErrors,
        },
      });
    }

    // Map UnauthorizedException → UNAUTHENTICATED
    if (exception instanceof UnauthorizedException) {
      throw new GraphQLError(exception.message || 'Unauthorized', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    // Map ForbiddenException → FORBIDDEN
    if (exception instanceof ForbiddenException) {
      throw new GraphQLError(exception.message || 'Forbidden', {
        extensions: { code: 'FORBIDDEN' },
      });
    }

    // Re-throw everything else for Apollo's formatError
    throw exception;
  }
}
