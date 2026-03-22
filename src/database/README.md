# Database Configuration

This directory contains TypeORM database configuration and migrations.

## Files

- `data-source.ts` - TypeORM DataSource configuration for CLI and migrations
- `migrations/` - Database migration files

## Connection Pooling

The application uses MySQL connection pooling with environment-specific settings:

### Development
- Pool size: 5 connections
- Connect timeout: 10 seconds
- Acquire timeout: 10 seconds
- SSL: Disabled

### Production
- Pool size: 20 connections
- Connect timeout: 10 seconds
- Acquire timeout: 10 seconds
- SSL: Enabled with `rejectUnauthorized: false`

## Migration Commands

```bash
# Generate a new migration based on entity changes
npm run migration:generate -- src/database/migrations/MigrationName

# Create an empty migration file
npm run migration:create -- src/database/migrations/MigrationName

# Run pending migrations
npm run migration:run

# Revert the last migration
npm run migration:revert

# Show migration status
npm run migration:show
```

## Environment Variables

Required database environment variables:

- `DB_HOST` - MySQL host (default: localhost)
- `DB_PORT` - MySQL port (default: 3306)
- `DB_USERNAME` - Database username
- `DB_PASSWORD` - Database password
- `DB_DATABASE` - Database name

## Features

- **Connection Pooling**: Efficient connection management with configurable pool size
- **Automatic Retry**: Connection failures are retried with exponential backoff (up to 3 times)
- **Environment-Specific**: Different configurations for development and production
- **SSL Support**: Enabled in production for secure connections
- **Migration Support**: Full TypeORM migration CLI integration
- **Auto-Load Entities**: Entities are automatically discovered and loaded
