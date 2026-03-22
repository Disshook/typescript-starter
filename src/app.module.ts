import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ASTNode, GraphQLError, GraphQLFormattedError } from 'graphql';
import {
  fieldExtensionsEstimator,
  getComplexity,
  simpleEstimator,
} from 'graphql-query-complexity';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppResolver } from './app.resolver';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import graphqlConfig from './config/graphql.config';
import jwtConfig from './config/jwt.config';
import { validationSchema } from './config/env.validation';
import { CommonModule } from './common/common.module';
import { DataLoaderFactory } from './common/services/dataloader.factory';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { PostModule } from './modules/post/post.module';
import { CommentModule } from './modules/comment/comment.module';
import { ProfileModule } from './modules/profile/profile.module';
import { TagModule } from './modules/tag/tag.module';

interface GqlNode {
  selectionSet?: { selections: GqlNode[] };
}

/**
 * Helper function to calculate query depth
 * Used for query depth limiting security feature
 */
function getDepth(node: GqlNode, depth = 0): number {
  if (!node.selectionSet) {
    return depth;
  }
  return Math.max(
    ...node.selectionSet.selections.map((selection) =>
      getDepth(selection, depth + 1),
    ),
  );
}

@Module({
  imports: [
    // Configuration module with environment validation
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, graphqlConfig, jwtConfig],
      validationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
      envFilePath:
        process.env.NODE_ENV === 'production'
          ? '.env.production'
          : '.env.development',
    }),

    // TypeORM module with async configuration
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql' as const,
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.database'),
        entities: [join(__dirname, '**/*.entity{.ts,.js}')],
        migrations: [join(__dirname, 'database/migrations/*{.ts,.js}')],
        synchronize: false,
        logging: configService.get('database.logging'),
        charset: configService.get<string>('database.charset'),
        timezone: configService.get<string>('database.timezone'),
        extra: {
          connectionLimit: configService.get<number>('database.poolSize'),
          connectTimeout: configService.get<number>('database.connectTimeout'),
          acquireTimeout: configService.get<number>('database.acquireTimeout'),
          waitForConnections: true,
          queueLimit: 0,
        },
        ssl: configService.get('database.ssl'),
        autoLoadEntities: true,
      }),
    }),

    // GraphQL module with code-first approach (Requirements 17.1-17.9, 18.3, 18.4, 18.7, 18.8)
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [ConfigModule],
      inject: [ConfigService, DataLoaderFactory],
      useFactory: (
        configService: ConfigService,
        dataLoaderFactory: DataLoaderFactory,
      ) => ({
        // Code-first approach: generate schema from TypeScript decorators
        autoSchemaFile:
          configService.get<string>('graphql.autoSchemaFile') === 'true'
            ? true
            : join(process.cwd(), 'src/schema.gql'),
        sortSchema: configService.get<boolean>('graphql.sortSchema'),

        // GraphQL Playground configuration (dev only)
        playground: configService.get<boolean>('graphql.playground'),

        // Introspection configuration (dev only)
        introspection: configService.get<boolean>('graphql.introspection'),

        // Debug mode
        debug: configService.get<boolean>('graphql.debug'),

        // GraphQL context with request, response, and DataLoaders
        // Requirements: 11.4, 11.5
        context: ({ req, res }: any) => ({
          req,
          res,
          // Create fresh DataLoader instances for each request (Requirement 11.4)
          // This ensures cache is scoped to the request (Requirement 11.5)
          loaders: dataLoaderFactory.createLoaders(),
        }),

        // Custom error formatting (Requirements 14.1-14.7, 14.13)
        formatError: (error: GraphQLError): GraphQLFormattedError => {
          const isProduction =
            configService.get('app.nodeEnv') === 'production';

          // Get the original error
          const originalError = error.extensions?.originalError as {
            statusCode?: number;
          } | null;
          const statusCode = originalError?.statusCode;

          // Map exception types to GraphQL error codes
          let code = 'INTERNAL_SERVER_ERROR';
          if (statusCode === 400) code = 'BAD_REQUEST';
          else if (statusCode === 401) code = 'UNAUTHENTICATED';
          else if (statusCode === 403) code = 'FORBIDDEN';
          else if (statusCode === 404) code = 'NOT_FOUND';
          else if (statusCode === 409) code = 'CONFLICT';
          else if (statusCode === 503) code = 'SERVICE_UNAVAILABLE';

          // In production, sanitize error messages and hide stack traces
          if (isProduction) {
            return {
              message:
                statusCode && statusCode < 500
                  ? error.message
                  : 'An internal server error occurred',
              extensions: {
                code,
                // Remove stack trace and other sensitive information in production
              },
            };
          }

          // In development, return full error details
          return {
            message: error.message,
            extensions: {
              code,
              stacktrace: error.extensions?.stacktrace,
              originalError: error.extensions?.originalError,
            },
            locations: error.locations,
            path: error.path,
          };
        },

        // Security settings: query depth and complexity limiting (Requirements 15.7-15.9, 15.16, 15.17)
        validationRules: [
          // Query depth limiting (max 10 levels)
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          (_context: unknown) => {
            const maxDepth = 10;
            return {
              enter(node: ASTNode) {
                const n = node as GqlNode;
                if (n.selectionSet) {
                  const depth = getDepth(n);
                  if (depth > maxDepth) {
                    throw new GraphQLError(
                      `Query depth exceeds maximum allowed depth of ${maxDepth}`,
                      {
                        extensions: { code: 'QUERY_DEPTH_EXCEEDED' },
                      },
                    );
                  }
                }
              },
            };
          },
        ],

        // Query complexity limiting
        plugins: [
          {
            requestDidStart() {
              return Promise.resolve({
                didResolveOperation({
                  request,
                  document,
                  schema,
                }: {
                  request: {
                    operationName?: string;
                    variables?: Record<string, unknown>;
                  };
                  document: Parameters<typeof getComplexity>[0]['query'];
                  schema: Parameters<typeof getComplexity>[0]['schema'];
                }) {
                  const isProduction =
                    configService.get('app.nodeEnv') === 'production';
                  const maxComplexity = isProduction ? 100 : 1000;

                  const complexity = getComplexity({
                    schema,
                    operationName: request.operationName,
                    query: document,
                    variables: request.variables,
                    estimators: [
                      fieldExtensionsEstimator(),
                      simpleEstimator({ defaultComplexity: 1 }),
                    ],
                  });

                  if (complexity > maxComplexity) {
                    throw new GraphQLError(
                      `Query complexity of ${complexity} exceeds maximum allowed complexity of ${maxComplexity}`,
                      {
                        extensions: { code: 'QUERY_COMPLEXITY_EXCEEDED' },
                      },
                    );
                  }
                  return Promise.resolve();
                },
              });
            },
          },
        ],
      }),
    }),

    // Common module (global)
    CommonModule,

    // Feature modules
    AuthModule,
    UserModule,
    PostModule,
    CommentModule,
    ProfileModule,
    TagModule,
  ],
  controllers: [AppController],
  providers: [AppService, AppResolver],
})
export class AppModule {}
