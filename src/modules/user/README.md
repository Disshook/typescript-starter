# User Module

This module manages user entities and related operations.

## User Entity

The User entity represents a user account in the system with the following fields:

### Fields

- **id**: UUID primary key (auto-generated)
- **email**: Unique email address (max 255 characters, indexed)
- **passwordHash**: Bcrypt hashed password (max 255 characters, not exposed in GraphQL)
- **firstName**: User's first name (max 100 characters)
- **lastName**: User's last name (max 100 characters)
- **roles**: Array of role strings (default: ['user'])
- **isActive**: Account active status (default: true)
- **createdAt**: Timestamp when user was created (auto-generated, indexed)
- **updatedAt**: Timestamp when user was last updated (auto-generated, indexed)

### Relations

- **posts**: One-to-many relationship with Post entity
- **profile**: One-to-one relationship with Profile entity (cascade enabled)

### Indexes

- Email field (for fast lookups)
- createdAt field (for sorting and filtering)
- updatedAt field (for sorting and filtering)

### Validation Rules

- Email: Must be valid email format, unique, max 255 characters
- Password: Minimum 8 characters before hashing, must contain uppercase, lowercase, and number
- firstName: Required, 1-100 characters
- lastName: Required, 1-100 characters
- roles: Array of valid role strings (user, admin, moderator)
- isActive: Boolean, defaults to true

### GraphQL Schema

The User entity is exposed in GraphQL with all fields except `passwordHash` which is kept private for security.

## Notes

- The Post and Profile relations use forward declarations until those entities are created
- The passwordHash field is intentionally not decorated with @Field() to keep it private in GraphQL
- Cascade delete is configured on the profile relation
