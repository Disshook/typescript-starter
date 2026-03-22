# Implementation Plan: NestJS GraphQL API with TypeORM and MySQL

## Overview

This implementation plan creates a production-ready NestJS GraphQL API with TypeORM integration and MySQL database support. The system follows a pragmatic resolver-service pattern where simple CRUD operations are handled directly in resolvers and complex business logic is delegated to services. The implementation includes authentication/authorization, input validation, DataLoader for N+1 query prevention, database migrations, comprehensive error handling, and testing.

## Tasks

- [x] 1. Project setup and configuration
  - Initialize NestJS project with required dependencies
  - Configure TypeScript with path aliases and decorators
  - Set up environment configuration with validation
  - Create development and production config files
  - Configure ESLint and Prettier
  - _Requirements: 1.1, 1.2, 18.1, 18.2_

- [x] 2. Database configuration and entities
  - [x] 2.1 Configure TypeORM with MySQL connection
    - Set up TypeORM module with connection pooling
    - Configure database connection for development and production
    - Set up data source configuration file
    - _Requirements: 1.3, 16.1, 16.2, 16.7, 16.8_

  - [x] 2.2 Create User entity with TypeORM and GraphQL decorators
    - Define User entity with all fields (id, email, passwordHash, firstName, lastName, roles, isActive, timestamps)
    - Add GraphQL ObjectType decorators
    - Configure indexes on email and timestamps
    - Set up relations to Post and Profile entities
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 2.3 Create Post entity with status enum
    - Define Post entity with all fields (id, title, content, slug, status, viewCount, publishedAt, timestamps)
    - Create PostStatus enum (DRAFT, PUBLISHED, ARCHIVED)
    - Add GraphQL ObjectType decorators
    - Configure indexes on slug, authorId, status, publishedAt
    - Set up relations to User, Comment, and Tag entities
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 2.4 Create Comment entity with nested replies support
    - Define Comment entity with all fields (id, content, isEdited, timestamps)
    - Set up self-referencing relation for nested replies (parent/replies)
    - Add GraphQL ObjectType decorators
    - Configure indexes on postId, authorId, parentId
    - Set up cascade delete relations
    - _Requirements: 6.1, 6.2, 6.5, 6.6, 6.9_

  - [x] 2.5 Create Profile entity
    - Define Profile entity with all fields (id, bio, avatarUrl, website, location, birthDate, timestamps)
    - Set up one-to-one relation with User
    - Add GraphQL ObjectType decorators
    - Configure unique index on userId
    - _Requirements: 7.1, 7.7_

  - [x] 2.6 Create Tag entity and post_tags junction table
    - Define Tag entity with all fields (id, name, slug, description, createdAt)
    - Set up many-to-many relation with Post using @JoinTable
    - Add GraphQL ObjectType decorators
    - Configure indexes on name and slug
    - _Requirements: 8.1, 8.2, 8.5, 8.6_

- [x] 3. Database migrations
  - [x] 3.1 Create migration for users table
    - Generate migration with all User fields
    - Add unique constraint on email
    - Add indexes on email and created_at
    - _Requirements: 13.6, 13.7_

  - [x] 3.2 Create migration for posts table
    - Generate migration with all Post fields
    - Add unique constraint on slug
    - Add indexes on slug, author_id, status, published_at
    - Add foreign key to users table with CASCADE delete
    - _Requirements: 13.6, 13.7_

  - [x] 3.3 Create migration for comments table
    - Generate migration with all Comment fields
    - Add indexes on post_id, author_id, parent_id
    - Add foreign keys with CASCADE delete
    - _Requirements: 13.6, 13.7_

  - [x] 3.4 Create migration for profiles table
    - Generate migration with all Profile fields
    - Add unique constraint on user_id
    - Add foreign key to users table with CASCADE delete
    - _Requirements: 13.6, 13.7_

  - [x] 3.5 Create migration for tags and post_tags tables
    - Generate migration for tags table with unique constraints
    - Create post_tags junction table with composite primary key
    - Add indexes on both foreign keys
    - _Requirements: 13.6, 13.7_

  - [x] 3.6 Set up migration execution in application bootstrap
    - Configure automatic migration check on startup
    - Implement migration execution with transaction support
    - Add error handling for migration failures
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.8_

- [ ] 4. Authentication and authorization infrastructure
  - [x] 4.1 Create password utility functions
    - Implement hashPassword function using bcrypt with 10 salt rounds
    - Implement comparePassword function using bcrypt.compare
    - Add password complexity validation
    - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 19.6, 19.7, 19.8, 15.1, 15.2_

  - [ ]* 4.2 Write property test for password hashing
    - **Property 6: Password Security**
    - **Validates: Requirements 19.5, 19.6, 19.7, 19.8, 19.10**
    - Test that same password produces different hashes
    - Test that all hashes verify correctly with bcrypt.compare
    - Test hash length is exactly 60 characters

  - [x] 4.3 Create JWT configuration and service
    - Configure JWT module with secret and expiration
    - Implement token generation for access and refresh tokens
    - Implement token verification and payload extraction
    - _Requirements: 2.5, 2.6, 2.7, 2.8, 15.3, 15.4_

  - [x] 4.4 Create JWT strategy for Passport
    - Implement JWT strategy to extract and validate tokens
    - Configure strategy to extract user from token payload
    - Set up strategy in auth module
    - _Requirements: 2.7, 2.8_

  - [x] 4.5 Create authentication guards
    - Implement JwtAuthGuard for GraphQL context
    - Implement GqlAuthGuard extending AuthGuard('jwt')
    - Create Public decorator to skip authentication
    - _Requirements: 3.1, 3.3_

  - [x] 4.6 Create authorization guards and decorators
    - Implement RolesGuard to check user roles
    - Create Roles decorator for role-based access control
    - Create CurrentUser decorator to extract user from context
    - _Requirements: 3.2, 3.4, 3.5_

  - [ ]* 4.7 Write property test for JWT token validity
    - **Property 1: Authentication Token Validity**
    - **Validates: Requirements 2.4, 2.5, 2.6, 2.7, 2.8**
    - Test that generated tokens are valid JWT format
    - Test that token expiration is correctly set
    - Test that token payload contains correct user information

- [ ] 5. Input validation and DTOs
  - [x] 5.1 Create common DTOs
    - Create PaginationInput DTO with page, limit, sortBy, sortOrder
    - Create PaginatedResponse generic DTO with items and pageInfo
    - Add validation decorators for pagination constraints
    - _Requirements: 12.1, 12.2, 12.3_

  - [x] 5.2 Create User input DTOs
    - Create CreateUserInput with email, password, firstName, lastName
    - Create UpdateUserInput with optional fields
    - Create RegisterInput extending CreateUserInput
    - Add validation decorators (IsEmail, MinLength, MaxLength, etc.)
    - _Requirements: 4.5, 4.6, 9.5, 9.6, 9.7_

  - [x] 5.3 Create Post input DTOs
    - Create CreatePostInput with title, content, slug, tags
    - Create UpdatePostInput with optional fields
    - Create PostFiltersInput for search and filtering
    - Add validation decorators for length and format constraints
    - _Requirements: 5.6, 5.7, 5.14_

  - [x] 5.4 Create Comment input DTOs
    - Create CreateCommentInput with postId, content, parentId
    - Create UpdateCommentInput with content field
    - Add validation decorators for content length
    - _Requirements: 6.3, 6.4, 6.5_

  - [x] 5.5 Create Profile and Tag input DTOs
    - Create CreateProfileInput and UpdateProfileInput
    - Create CreateTagInput and UpdateTagInput
    - Add validation decorators for URLs, dates, and length constraints
    - _Requirements: 7.2, 7.3, 7.4, 7.5, 8.2, 8.3, 8.4_

  - [x] 5.6 Configure global validation pipe
    - Set up ValidationPipe with whitelist and transform options
    - Configure forbidNonWhitelisted to remove extra fields
    - Enable implicit type conversion
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [ ]* 5.7 Write property test for input validation
    - **Property 5: Input Validation**
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.9, 9.10**
    - Test that invalid inputs throw BadRequestException
    - Test that valid inputs are transformed correctly
    - Test that non-whitelisted fields are removed

- [ ] 6. GraphQL module configuration
  - [x] 6.1 Configure GraphQL module with Apollo Server
    - Set up GraphQL module with code-first approach
    - Configure auto schema file generation
    - Set up GraphQL context with request and DataLoaders
    - Configure playground and introspection based on environment
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6, 17.7, 17.8, 17.9, 18.3, 18.4, 18.7, 18.8_

  - [x] 6.2 Configure GraphQL error formatting
    - Implement custom error formatter to sanitize errors in production
    - Map exception types to appropriate GraphQL error codes
    - Ensure stack traces are hidden in production
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.13_

  - [x] 6.3 Configure GraphQL security settings
    - Implement query depth limiting (max 5 levels)
    - Implement query complexity limiting
    - Configure based on environment (strict in production)
    - _Requirements: 15.7, 15.8, 15.9, 15.16, 15.17_

- [x] 7. DataLoader implementation for N+1 prevention
  - [x] 7.1 Create DataLoader factory and registry
    - Implement DataLoaderRegistry interface
    - Create factory functions for User, Post, and Comment loaders
    - Set up loader creation in GraphQL context
    - _Requirements: 11.4, 11.5_

  - [x] 7.2 Implement User DataLoader
    - Create batch loading function for users by IDs
    - Ensure results maintain input ID order
    - Handle missing users by returning null
    - _Requirements: 11.1, 11.2, 11.3, 11.8, 11.9_

  - [x] 7.3 Implement Post and Comment DataLoaders
    - Create batch loading functions for posts and comments
    - Implement same ordering and null-handling logic
    - _Requirements: 11.1, 11.2, 11.3, 11.8, 11.9_

  - [ ]* 7.4 Write property test for DataLoader batching
    - **Property 4: DataLoader N+1 Prevention**
    - **Validates: Requirements 11.1, 11.2, 11.3, 11.8**
    - Test that multiple loads result in single database query
    - Test that result order matches input ID order
    - Test that result length equals input length

- [x] 8. Authentication module implementation
  - [x] 8.1 Create AuthService with complex business logic
    - Implement validateUser method with password verification
    - Implement login method with token generation
    - Implement register method with password hashing and user creation
    - Implement refreshToken method
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.9, 2.10, 2.11, 2.12_

  - [x] 8.2 Create AuthResolver with mutations
    - Implement register mutation
    - Implement login mutation
    - Implement refreshToken mutation
    - Return AuthPayload with tokens and user
    - _Requirements: 2.1, 2.2, 2.3, 2.12_

  - [x] 8.3 Create AuthPayload output type
    - Define AuthPayload with accessToken, refreshToken, user, expiresIn
    - Add GraphQL ObjectType decorators
    - _Requirements: 2.3, 2.5, 2.6_

  - [ ]* 8.4 Write unit tests for AuthService
    - Test validateUser with valid and invalid credentials
    - Test login returns valid tokens
    - Test register creates user with hashed password
    - Test inactive user login is rejected

  - [ ]* 8.5 Write unit tests for AuthResolver
    - Test register mutation with valid input
    - Test login mutation with valid credentials
    - Test error handling for invalid inputs

- [x] 9. User module implementation
  - [x] 9.1 Create UserService for complex operations
    - Implement findByIds for DataLoader (batch loading)
    - Implement findAll with pagination, filtering, and sorting
    - Implement registerUser with password hashing and validation
    - Implement createUserWithProfile using transaction
    - _Requirements: 4.8, 4.9, 10.5_

  - [x] 9.2 Create UserResolver with queries and mutations
    - Implement user query (simple: direct repository.findOne)
    - Implement users query with pagination (complex: use service)
    - Implement me query for current user (simple: direct repository)
    - Implement createUser mutation (simple: direct repository.save)
    - Implement updateUser mutation (simple: direct repository.update)
    - Implement deleteUser mutation (simple: direct repository.delete)
    - Apply authentication guards to protected operations
    - _Requirements: 4.4, 4.5, 4.6, 4.7, 3.6_

  - [x] 9.3 Implement field resolvers for User relations
    - Implement posts field resolver using DataLoader
    - Implement profile field resolver using DataLoader
    - _Requirements: 11.6_

  - [ ]* 9.4 Write unit tests for UserService
    - Test findByIds returns users in correct order
    - Test findAll pagination logic
    - Test createUserWithProfile transaction

  - [ ]* 9.5 Write unit tests for UserResolver
    - Test queries return correct data
    - Test mutations with authentication
    - Test authorization for protected operations

- [x] 10. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Post module implementation
  - [x] 11.1 Create PostService for complex operations
    - Implement findByIds for DataLoader
    - Implement findAll with pagination, filtering, and sorting
    - Implement searchPosts with full-text search
    - Implement publishPost with status update and publishedAt timestamp
    - _Requirements: 5.8, 5.12, 21.6_

  - [x] 11.2 Create PostResolver with queries and mutations
    - Implement post query with viewCount increment (simple with side effect)
    - Implement posts query with pagination (complex: use service)
    - Implement searchPosts query (complex: use service)
    - Implement createPost mutation (simple: direct repository.save)
    - Implement updatePost mutation with authorization check (simple with auth)
    - Implement deletePost mutation with authorization check (simple with auth)
    - Apply authentication guards and role checks
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.9, 5.13, 5.15, 5.16, 3.7_

  - [x] 11.3 Implement field resolvers for Post relations
    - Implement author field resolver using DataLoader
    - Implement comments field resolver using DataLoader
    - Implement tags field resolver
    - _Requirements: 11.6, 11.7_

  - [ ]* 11.4 Write unit tests for PostService
    - Test findAll with pagination and sorting
    - Test searchPosts with filters
    - Test publishPost updates status and timestamp

  - [ ]* 11.5 Write unit tests for PostResolver
    - Test post query increments viewCount
    - Test createPost with valid input
    - Test updatePost authorization
    - Test deletePost authorization

- [x] 12. Comment module implementation
  - [x] 12.1 Create CommentService for complex operations
    - Implement findByIds for DataLoader
    - Implement findByPostId with nested replies
    - Implement validation to prevent circular references
    - _Requirements: 6.6, 6.10, 6.13_

  - [x] 12.2 Create CommentResolver with queries and mutations
    - Implement comments query for a post
    - Implement createComment mutation with validation (simple with validation)
    - Implement updateComment mutation with isEdited flag and authorization
    - Implement deleteComment mutation with authorization
    - Apply authentication guards
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.7, 6.8, 6.11, 6.12_

  - [x] 12.3 Implement field resolvers for Comment relations
    - Implement author field resolver using DataLoader
    - Implement post field resolver using DataLoader
    - Implement parent field resolver using DataLoader
    - Implement replies field resolver
    - _Requirements: 11.7_

  - [ ]* 12.4 Write unit tests for CommentService
    - Test findByPostId returns nested structure
    - Test circular reference prevention

  - [ ]* 12.5 Write unit tests for CommentResolver
    - Test createComment with valid input
    - Test createComment with parentId
    - Test updateComment sets isEdited flag
    - Test authorization checks

- [x] 13. Profile module implementation
  - [x] 13.1 Create ProfileResolver with simple CRUD operations
    - Implement profile query (simple: direct repository.findOne)
    - Implement createProfile mutation (simple: direct repository.save)
    - Implement updateProfile mutation (simple: direct repository.update)
    - Apply authentication guards
    - Validate avatarUrl is HTTPS and birthDate age >= 13
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.8, 7.9, 7.10_

  - [x] 13.2 Implement field resolver for Profile.user
    - Implement user field resolver using DataLoader
    - _Requirements: 11.7_

  - [ ]* 13.3 Write unit tests for ProfileResolver
    - Test createProfile with valid input
    - Test updateProfile with valid data
    - Test avatarUrl HTTPS validation
    - Test birthDate age validation

- [x] 14. Tag module implementation
  - [x] 14.1 Create TagResolver with simple CRUD operations
    - Implement tag query (simple: direct repository.findOne)
    - Implement tags query with pagination (simple: direct repository.find)
    - Implement createTag mutation (simple: direct repository.save)
    - Implement updateTag mutation (simple: direct repository.update)
    - Validate name and slug uniqueness
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.7, 8.8, 8.9_

  - [x] 14.2 Implement field resolver for Tag.posts
    - Implement posts field resolver to return associated posts
    - _Requirements: 8.7_

  - [ ]* 14.3 Write unit tests for TagResolver
    - Test createTag with valid input
    - Test duplicate name/slug validation
    - Test tag query returns associated posts

- [x] 15. Transaction management and cascade deletion
  - [x] 15.1 Implement transaction wrapper utility
    - Create helper function for executing operations in transactions
    - Implement automatic rollback on errors
    - Add retry logic for deadlock scenarios
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.8_

  - [x] 15.2 Verify cascade deletion configuration
    - Verify User deletion cascades to Posts, Comments, Profile
    - Verify Post deletion cascades to Comments and removes post_tags
    - Verify Comment deletion cascades to reply Comments
    - Verify Tag deletion removes post_tags but preserves Posts
    - _Requirements: 4.7, 5.10, 5.11, 6.9, 7.7, 8.6, 20.1, 20.2, 20.3, 20.4, 20.5, 20.6, 20.7_

  - [ ]* 15.3 Write property test for transaction integrity
    - **Property 2: Data Integrity in Transactions**
    - **Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.7**
    - Test that successful transactions commit all changes
    - Test that failed transactions rollback all changes
    - Test that no partial data persists on failure

  - [ ]* 15.4 Write property test for cascade deletion
    - **Property 8: Cascade Deletion**
    - **Validates: Requirements 4.7, 4.10, 4.11, 5.10, 6.9, 7.7, 20.1-20.9**
    - Test that entity deletion removes all related entities
    - Test that junction table records are removed
    - Test that no orphaned foreign keys remain

- [x] 16. Pagination implementation
  - [x] 16.1 Implement pagination helper utility
    - Create function to calculate offset from page and limit
    - Create function to build pageInfo from query results
    - Validate pagination parameters
    - _Requirements: 12.4, 12.5, 12.6, 12.7, 12.8, 12.9, 12.11, 12.12_

  - [x] 16.2 Apply pagination to all list queries
    - Update users query with pagination
    - Update posts query with pagination
    - Update tags query with pagination
    - Add sorting support to all paginated queries
    - _Requirements: 4.8, 5.12, 12.10_

  - [ ]* 16.3 Write property test for pagination consistency
    - **Property 7: Pagination Consistency**
    - **Validates: Requirements 12.5, 12.6, 12.7, 12.8, 12.9**
    - Test that items length never exceeds limit
    - Test that pageInfo calculations are correct
    - Test that hasNextPage and hasPreviousPage are accurate

- [x] 17. Error handling and logging
  - [x] 17.1 Create global exception filter
    - Implement AllExceptionsFilter to catch all errors
    - Map TypeORM errors to appropriate HTTP exceptions
    - Sanitize error messages in production
    - Log errors with context information
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.8, 14.13_

  - [x] 17.2 Create GraphQL exception filter
    - Implement GraphQLExceptionFilter for GraphQL-specific errors
    - Format validation errors with field-specific messages
    - Handle authentication and authorization errors
    - _Requirements: 14.2, 14.3, 14.4_

  - [x] 17.3 Configure logging interceptor
    - Implement LoggingInterceptor to log requests and responses
    - Configure log levels based on environment
    - Use JSON format in production, pretty print in development
    - Never log sensitive data (passwords, tokens)
    - _Requirements: 14.8, 14.9, 14.10, 14.11, 14.12, 15.14_

  - [ ]* 17.4 Write unit tests for exception filters
    - Test that validation errors return 400 with field messages
    - Test that auth errors return 401
    - Test that authorization errors return 403
    - Test that not found errors return 404
    - Test that duplicate errors return 409

- [ ] 18. Security implementation
  - [ ] 18.1 Configure Helmet security headers
    - Set up Helmet middleware with CSP, HSTS, and other headers
    - Configure based on environment (strict in production)
    - _Requirements: 15.10, 15.11, 15.12_

  - [ ] 18.2 Configure CORS with whitelist
    - Set up CORS with environment-specific allowed origins
    - Enable credentials for authenticated requests
    - Restrict methods and headers
    - _Requirements: 1.6, 15.13, 18.9, 18.10_

  - [ ] 18.3 Implement rate limiting
    - Set up Throttler module with configurable limits
    - Configure different limits for development and production
    - Return 429 with Retry-After header when exceeded
    - _Requirements: 15.6, 15.15, 18.11, 18.12_

  - [ ] 18.4 Implement account lockout for failed login attempts
    - Track failed login attempts per user
    - Lock account after 5 failed attempts within 15 minutes
    - Implement unlock mechanism after timeout
    - _Requirements: 15.5_

  - [ ]* 18.5 Write unit tests for security features
    - Test rate limiting blocks excessive requests
    - Test account lockout after failed attempts
    - Test CORS blocks unauthorized origins

- [ ] 19. Query optimization and indexing
  - [ ] 19.1 Verify database indexes are created
    - Verify indexes on users.email, posts.slug, posts.author_id
    - Verify indexes on comments.post_id, comments.author_id
    - Verify indexes on profiles.user_id, tags.name, tags.slug
    - Verify composite indexes on post_tags junction table
    - _Requirements: 21.2, 21.3, 21.4_

  - [ ] 19.2 Implement eager loading for common relations
    - Use leftJoinAndSelect for frequently accessed relations
    - Optimize queries to fetch only required fields
    - _Requirements: 21.1, 21.5_

  - [ ] 19.3 Configure slow query logging
    - Set up logging for queries exceeding 1 second
    - Log query execution time and parameters
    - _Requirements: 21.8_

- [ ] 20. Health check and monitoring
  - [ ] 20.1 Create health check module
    - Implement health check endpoint at /health
    - Check database connectivity
    - Return appropriate status codes (200 for healthy, 503 for unhealthy)
    - _Requirements: 1.8, 22.1, 22.2, 22.3, 22.4, 22.5, 22.7_

  - [ ] 20.2 Add detailed health check information
    - Include database status, memory usage, and uptime
    - Return detailed information in response
    - _Requirements: 22.6_

  - [ ]* 20.3 Write integration tests for health check
    - Test health endpoint returns 200 when healthy
    - Test health endpoint returns 503 when database is down

- [ ] 21. Application bootstrap and startup
  - [ ] 21.1 Implement main.ts bootstrap function
    - Create NestJS application instance
    - Configure global pipes, filters, and interceptors
    - Enable CORS and security middleware
    - Start server on configured port
    - _Requirements: 1.5, 1.6, 1.7_

  - [ ] 21.2 Implement environment variable validation
    - Create Joi validation schema for all required env vars
    - Validate on application startup
    - Throw error if required variables are missing
    - _Requirements: 1.1, 1.2, 1.9, 18.13_

  - [ ] 21.3 Implement database connection retry logic
    - Add retry mechanism with exponential backoff
    - Retry up to 3 times on connection failure
    - Log connection attempts and failures
    - _Requirements: 1.10, 16.10_

  - [ ]* 21.4 Write integration tests for application bootstrap
    - Test application starts successfully with valid config
    - Test application fails with missing env variables
    - Test database connection retry logic

- [ ] 22. Integration and end-to-end testing
  - [ ]* 22.1 Write E2E test for authentication flow
    - Test user registration creates account
    - Test login returns valid tokens
    - Test protected endpoint access with token
    - Test token expiration and refresh

  - [ ]* 22.2 Write E2E test for post creation and querying
    - Test creating post with authentication
    - Test querying post with author and comments
    - Test DataLoader prevents N+1 queries (verify query count)

  - [ ]* 22.3 Write E2E test for comment threading
    - Test creating comment on post
    - Test creating reply to comment
    - Test querying comments with nested replies

  - [ ]* 22.4 Write E2E test for pagination
    - Create multiple posts
    - Test pagination across multiple pages
    - Verify no duplicates and all items returned

  - [ ]* 22.5 Write E2E test for authorization
    - Test user can only modify their own resources
    - Test admin can modify any resource
    - Test unauthorized access returns 403

  - [ ]* 22.6 Write E2E test for cascade deletion
    - Create user with posts and comments
    - Delete user and verify all related data is removed
    - Verify no orphaned records remain

- [ ] 23. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 24. Documentation and deployment preparation
  - [ ] 24.1 Create README with setup instructions
    - Document environment variables
    - Document database setup and migrations
    - Document running the application
    - Document API endpoints and GraphQL playground

  - [ ] 24.2 Create Docker configuration
    - Create Dockerfile for production build
    - Create docker-compose.yml for development
    - Create docker-compose.prod.yml for production

  - [ ] 24.3 Create seed data scripts (optional)
    - Create seed script for users
    - Create seed script for posts and tags
    - Document how to run seeds

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- Integration tests validate end-to-end flows
- The implementation follows NestJS best practices with modular architecture
- Simple CRUD operations are implemented directly in resolvers
- Complex business logic is delegated to service layer
- DataLoader is used throughout to prevent N+1 query problems
- All database operations use TypeORM with proper transaction management
- Security is enforced at multiple layers (authentication, authorization, validation, rate limiting)
