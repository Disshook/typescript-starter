# NestJS GraphQL API with TypeORM and MySQL

A production-ready NestJS GraphQL API with TypeORM integration and MySQL database support.

## Features

- 🚀 NestJS framework with TypeScript
- 🔐 JWT authentication and authorization
- 📊 GraphQL API with Apollo Server
- 💾 TypeORM with MySQL database
- ✅ Input validation with class-validator
- 🔒 Security features (Helmet, CORS, Rate limiting)
- 📝 Environment-based configuration
- 🧪 Testing setup with Jest
- 🎨 Code formatting with Prettier
- 🔍 Linting with ESLint

## Prerequisites

- Node.js >= 20.0.0
- npm >= 10.0.0
- MySQL >= 8.0

## Installation

```bash
# Install dependencies
npm install
```

## Configuration

### Environment Variables

Copy the appropriate environment file for your environment:

**Development:**
```bash
cp .env.development .env
```

**Production:**
```bash
cp .env.production .env
```

### Required Environment Variables

- `NODE_ENV` - Environment (development, production, test)
- `PORT` - Application port (default: 3000)
- `DB_HOST` - MySQL host
- `DB_PORT` - MySQL port (default: 3306)
- `DB_USERNAME` - MySQL username
- `DB_PASSWORD` - MySQL password
- `DB_DATABASE` - MySQL database name
- `JWT_SECRET` - JWT secret key (min 32 characters)
- `JWT_EXPIRES_IN` - JWT expiration time (default: 1h)
- `JWT_REFRESH_SECRET` - JWT refresh token secret
- `JWT_REFRESH_EXPIRES_IN` - JWT refresh token expiration (default: 7d)
- `CORS_ORIGINS` - Comma-separated list of allowed origins
- `RATE_LIMIT_TTL` - Rate limit time window in seconds (default: 900)
- `RATE_LIMIT_MAX` - Maximum requests per time window (default: 100)
- `GRAPHQL_PLAYGROUND` - Enable GraphQL playground (default: false)
- `GRAPHQL_INTROSPECTION` - Enable GraphQL introspection (default: false)
- `GRAPHQL_DEBUG` - Enable GraphQL debug mode (default: false)

## Database Setup

1. Create a MySQL database:
```sql
CREATE DATABASE nestjs_graphql_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. Update the database credentials in your `.env` file

3. Run migrations (to be implemented in Task 3):
```bash
npm run migration:run
```

## Running the Application

### Development
```bash
npm run start:dev
```

### Production
```bash
npm run build
npm run start:prod
```

### Debug Mode
```bash
npm run start:debug
```

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Code Quality

```bash
# Format code
npm run format

# Lint code
npm run lint
```

## GraphQL Playground

When running in development mode with `GRAPHQL_PLAYGROUND=true`, access the GraphQL playground at:

```
http://localhost:3000/graphql
```

## Project Structure

```
src/
├── common/              # Shared utilities, decorators, guards, interceptors
├── config/              # Configuration files
├── database/            # Database migrations and seeds
├── modules/             # Feature modules
├── app.module.ts        # Root application module
└── main.ts              # Application entry point
```

## TypeScript Path Aliases

The project uses TypeScript path aliases for cleaner imports:

- `@common/*` - Common utilities and shared code
- `@config/*` - Configuration files
- `@modules/*` - Feature modules
- `@database/*` - Database-related files

Example:
```typescript
import { CurrentUser } from '@common/decorators/current-user.decorator';
import databaseConfig from '@config/database.config';
```

## Architecture

This project follows a pragmatic resolver-service pattern:

- **Simple CRUD operations**: Implemented directly in GraphQL resolvers
- **Complex business logic**: Delegated to service layer
- **Repositories**: Direct database access via TypeORM
- **Guards**: Authentication and authorization
- **Pipes**: Input validation and transformation
- **Interceptors**: Logging, caching, response transformation

## Security Features

- Password hashing with bcrypt
- JWT-based authentication
- Role-based access control
- Rate limiting
- Helmet security headers
- CORS configuration
- Input validation
- SQL injection prevention (via TypeORM)

## License

MIT
