import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * Logging interceptor for HTTP and GraphQL requests.
 *
 * - Logs incoming request: method, url/operation, timestamp
 * - Logs outgoing response: statusCode, duration in ms
 * - Production: JSON format
 * - Development: pretty-print format
 * - Never logs request body, auth headers, passwords, or tokens
 *
 * Requirements: 14.8, 14.9, 14.10, 14.11, 14.12, 15.14
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');
  private readonly isProduction = process.env.NODE_ENV === 'production';

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const startTime = Date.now();
    const { method, url, operationName } = this.extractRequestInfo(context);
    const timestamp = new Date().toISOString();
    const displayUrl = url ?? operationName;

    this.logIncoming({ method, url: displayUrl, timestamp });

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const statusCode = this.extractStatusCode(context);
          this.logOutgoing({
            method,
            url: displayUrl,
            statusCode,
            duration,
            timestamp,
          });
        },
        // Error logging is handled by the exception filter
      }),
    );
  }

  private extractRequestInfo(context: ExecutionContext): {
    method: string;
    url: string | undefined;
    operationName: string;
  } {
    const type = context.getType<string>();

    if (type === 'graphql') {
      const gqlCtx = GqlExecutionContext.create(context);
      const req = gqlCtx.getContext<{ req: Record<string, unknown> }>()?.req;
      const body = req?.['body'] as Record<string, unknown> | undefined;

      const gqlInfo = gqlCtx.getInfo();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const infoName = gqlInfo?.operation?.name?.value as string | undefined;
      const operationName: string =
        (typeof body?.['operationName'] === 'string'
          ? body['operationName']
          : undefined) ??
        infoName ??
        'GraphQL';
      return { method: 'POST', url: undefined, operationName };
    }

    const req = context
      .switchToHttp()
      .getRequest<{ method: string; url: string }>();
    return {
      method: req?.method ?? 'UNKNOWN',
      url: req?.url ?? '/',
      operationName: '',
    };
  }

  private extractStatusCode(context: ExecutionContext): number {
    const type = context.getType<string>();
    if (type === 'graphql') {
      return 200;
    }
    const res = context.switchToHttp().getResponse<{ statusCode?: number }>();
    return res?.statusCode ?? 200;
  }

  private logIncoming(info: {
    method: string;
    url: string;
    timestamp: string;
  }): void {
    if (this.isProduction) {
      this.logger.log(
        JSON.stringify({
          level: 'info',
          event: 'request',
          timestamp: info.timestamp,
          method: info.method,
          url: info.url,
        }),
      );
    } else {
      this.logger.log(`[${info.timestamp}] → ${info.method} ${info.url}`);
    }
  }

  private logOutgoing(info: {
    method: string;
    url: string;
    statusCode: number;
    duration: number;
    timestamp: string;
  }): void {
    if (this.isProduction) {
      this.logger.log(
        JSON.stringify({
          level: 'info',
          event: 'response',
          timestamp: info.timestamp,
          method: info.method,
          url: info.url,
          statusCode: info.statusCode,
          duration: info.duration,
        }),
      );
    } else {
      this.logger.log(
        `[${info.timestamp}] ← ${info.method} ${info.url} ${info.statusCode} - ${info.duration}ms`,
      );
    }
  }
}
