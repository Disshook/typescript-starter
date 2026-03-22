import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import dataSource from './database/data-source';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

const logger = new Logger('Bootstrap');

async function runMigrations(): Promise<void> {
  try {
    logger.log('Checking for pending migrations...');

    // Initialize data source if not already initialized
    if (!dataSource.isInitialized) {
      await dataSource.initialize();
      logger.log('Database connection established');
    }

    // Check if there are pending migrations
    const pendingMigrations = await dataSource.showMigrations();

    if (!pendingMigrations) {
      logger.log('No pending migrations');
      return;
    }

    // Execute pending migrations in chronological order within a transaction
    logger.log('Running pending migrations...');
    await dataSource.runMigrations({
      transaction: 'all', // Run all migrations in single transaction (Requirement 13.4)
    });

    // Verify migrations were applied
    const remainingMigrations = await dataSource.showMigrations();

    if (remainingMigrations) {
      throw new Error('Some migrations failed to apply');
    }

    logger.log('All migrations completed successfully');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    logger.error('Migration execution failed:', errorMessage);
    if (errorStack) {
      logger.error(errorStack);
    }
    throw new Error(`Migration failed: ${errorMessage}`);
  }
}

async function bootstrap() {
  try {
    // Run migrations before starting the application (Requirements 13.1, 13.2, 13.3, 13.5)
    await runMigrations();

    // Create NestJS application
    const app = await NestFactory.create(AppModule);

    // Configure global validation pipe (Requirements 9.1, 9.2, 9.3, 9.4)
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true, // Strip properties that don't have decorators
        forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are present
        transform: true, // Automatically transform payloads to DTO instances
        transformOptions: {
          enableImplicitConversion: true, // Enable implicit type conversion
        },
      }),
    );

    // Register global exception filter (Requirements 14.1-14.8, 14.13)
    app.useGlobalFilters(new AllExceptionsFilter());

    // Register global logging interceptor (Requirements 14.8-14.12, 15.14)
    app.useGlobalInterceptors(new LoggingInterceptor());

    // Enable CORS
    app.enableCors({
      origin: (process.env.CORS_ORIGINS ?? 'http://localhost:3000').split(','),
      credentials: true,
    });

    // Start the server
    const port = process.env.PORT || 3003;
    await app.listen(port);
    logger.log(`Application is running on: http://localhost:${port}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    logger.error('Application bootstrap failed:', errorMessage);
    if (errorStack) {
      logger.error(errorStack);
    }
    process.exit(1); // Exit with error code if bootstrap fails
  }
}

void bootstrap();
